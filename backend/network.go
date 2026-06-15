package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ─── Proxy Pool & Rotation Engine ────────────────────────────────────────────

type ProxyEntry struct {
	URL      string `json:"url"`
	Protocol string `json:"protocol"` // socks5, http, https, vless, vmess, trojan, ss, hysteria2, tuic
	alive    bool
	latency  time.Duration
}

type RotationMode string

const (
	RotPerRequest RotationMode = "per_request"
	RotPerSession RotationMode = "per_session"
	RotInterval   RotationMode = "interval"
)

type ProxyPool struct {
	mu           sync.RWMutex
	entries      []ProxyEntry
	currentIdx   int64
	requestCount int64
	mode         RotationMode
	modeValue    int // N requests or N seconds
	lastRotation time.Time
	sessionMap   sync.Map // session_id -> proxy_idx
}

var globalPool = &ProxyPool{
	mode:      RotPerRequest,
	modeValue: 1,
}

// ParseProxyList parses newline-separated proxy URIs into ProxyEntry slice
func ParseProxyList(raw string) []ProxyEntry {
	var entries []ProxyEntry
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Detect protocol
		proto := "http"
		if strings.Contains(line, "://") {
			parts := strings.SplitN(line, "://", 2)
			proto = strings.ToLower(parts[0])
		}

		entries = append(entries, ProxyEntry{
			URL:      line,
			Protocol: proto,
			alive:    true,
		})
	}
	return entries
}

// LoadProxyPool loads proxy pool from settings
func LoadProxyPool() {
	raw := GetSetting("proxy_pool", "")
	mode := GetSetting("rotation_mode", "per_request")
	val := GetSetting("rotation_value", "1")

	entries := ParseProxyList(raw)

	globalPool.mu.Lock()
	defer globalPool.mu.Unlock()
	globalPool.entries = entries
	globalPool.mode = RotationMode(mode)
	fmt.Sscanf(val, "%d", &globalPool.modeValue)
	if globalPool.modeValue < 1 {
		globalPool.modeValue = 1
	}
	globalPool.lastRotation = time.Now()

	log.Printf("[Network] Loaded proxy pool: %d entries, mode=%s, value=%d", len(entries), mode, globalPool.modeValue)
}

// NextProxy returns the next proxy URL based on rotation logic
func NextProxy(sessionID string) string {
	globalPool.mu.RLock()
	defer globalPool.mu.RUnlock()

	if len(globalPool.entries) == 0 {
		return ""
	}

	// Filter alive proxies
	var alive []int
	for i, e := range globalPool.entries {
		if e.alive {
			alive = append(alive, i)
		}
	}
	if len(alive) == 0 {
		return ""
	}

	var idx int
	switch globalPool.mode {
	case RotPerRequest:
		count := atomic.AddInt64(&globalPool.requestCount, 1)
		if count%int64(globalPool.modeValue) == 0 {
			newIdx := atomic.AddInt64(&globalPool.currentIdx, 1)
			idx = alive[int(newIdx)%len(alive)]
		} else {
			idx = alive[int(atomic.LoadInt64(&globalPool.currentIdx))%len(alive)]
		}

	case RotPerSession:
		if sessionID != "" {
			if stored, ok := globalPool.sessionMap.Load(sessionID); ok {
				idx = stored.(int) % len(alive)
			} else {
				// Assign a random proxy for this session
				newIdx := rand.Intn(len(alive))
				globalPool.sessionMap.Store(sessionID, newIdx)
				idx = alive[newIdx]
			}
		} else {
			idx = alive[int(atomic.LoadInt64(&globalPool.currentIdx))%len(alive)]
		}

	case RotInterval:
		elapsed := time.Since(globalPool.lastRotation)
		if elapsed > time.Duration(globalPool.modeValue)*time.Second {
			newIdx := atomic.AddInt64(&globalPool.currentIdx, 1)
			globalPool.lastRotation = time.Now()
			idx = alive[int(newIdx)%len(alive)]
		} else {
			idx = alive[int(atomic.LoadInt64(&globalPool.currentIdx))%len(alive)]
		}
	}

	return globalPool.entries[idx].URL
}

// GetProxyFunc returns an http.Transport-compatible proxy function
// For simple protocols (http, https, socks5), returns a standard ProxyURL
// For advanced protocols (vless, vmess, trojan, ss, hysteria2, tuic), will be handled separately
func GetProxyFunc() func(*http.Request) (*url.URL, error) {
	return func(r *http.Request) (*url.URL, error) {
		proxyURL := NextProxy("")
		if proxyURL == "" {
			return nil, nil // direct connection
		}

		// For simple proxy types, parse URL directly
		u, err := url.Parse(proxyURL)
		if err != nil {
			log.Printf("[Network] Invalid proxy URL: %s (%v)", proxyURL, err)
			return nil, nil
		}

		// Standard HTTP/SOCKS5 proxies
		switch u.Scheme {
		case "http", "https", "socks5":
			return u, nil
		default:
			// For advanced protocols (vless, vmess, trojan, ss, hysteria2, tuic)
			// These require custom transport integration via xray-core/sing-box
			// For now, log and skip
			log.Printf("[Network] Advanced protocol %s requires xray-core/sing-box (not yet wired)", u.Scheme)
			return nil, nil
		}
	}
}

// ─── Proxy Health Check ──────────────────────────────────────────────────────

type CheckResult struct {
	URL     string `json:"url"`
	OK      bool   `json:"ok"`
	Latency int    `json:"latency"` // ms
}

func (a *App) CheckProxyPool(raw string) []CheckResult {
	entries := ParseProxyList(raw)
	results := make([]CheckResult, len(entries))
	var wg sync.WaitGroup

	for i, entry := range entries {
		wg.Add(1)
		go func(idx int, e ProxyEntry) {
			defer wg.Done()
			result := CheckResult{URL: e.URL}

			start := time.Now()
			switch e.Protocol {
			case "http", "https", "socks5":
				u, err := url.Parse(e.URL)
				if err != nil {
					result.OK = false
					results[idx] = result
					return
				}

				client := &http.Client{
					Timeout: 10 * time.Second,
					Transport: &http.Transport{
						Proxy: http.ProxyURL(u),
						DialContext: (&net.Dialer{
							Timeout: 5 * time.Second,
						}).DialContext,
					},
				}

				resp, err := client.Get("https://httpbin.org/ip")
				if err != nil {
					result.OK = false
				} else {
					resp.Body.Close()
					result.OK = resp.StatusCode == 200
				}

			default:
				// Advanced protocols — attempt TCP connect to host:port
				u, err := url.Parse(e.URL)
				if err != nil {
					result.OK = false
					results[idx] = result
					return
				}
				host := u.Host
				if !strings.Contains(host, ":") {
					host += ":443"
				}
				conn, err := net.DialTimeout("tcp", host, 5*time.Second)
				if err != nil {
					result.OK = false
				} else {
					conn.Close()
					result.OK = true
				}
			}

			result.Latency = int(time.Since(start).Milliseconds())
			results[idx] = result
		}(i, entry)
	}

	wg.Wait()

	// Update pool alive status
	globalPool.mu.Lock()
	for i, r := range results {
		if i < len(globalPool.entries) {
			globalPool.entries[i].alive = r.OK
			globalPool.entries[i].latency = time.Duration(r.Latency) * time.Millisecond
		}
	}
	globalPool.mu.Unlock()

	return results
}

// ─── Network Settings JSON API ───────────────────────────────────────────────

type NetworkConfig struct {
	ProxyPool     string `json:"proxy_pool"`
	RotationMode  string `json:"rotation_mode"`
	RotationValue string `json:"rotation_value"`
	DnsMode       string `json:"dns_mode"`
	DnsValue      string `json:"dns_value"`
	Ja3Profile    string `json:"ja3_profile"`
}

func (a *App) GetNetworkConfig() string {
	cfg := NetworkConfig{
		ProxyPool:     GetSetting("proxy_pool", ""),
		RotationMode:  GetSetting("rotation_mode", "per_request"),
		RotationValue: GetSetting("rotation_value", "1"),
		DnsMode:       GetSetting("dns_mode", "system"),
		DnsValue:      GetSetting("dns_value", ""),
		Ja3Profile:    GetSetting("ja3_profile", "chrome_122"),
	}
	b, _ := json.Marshal(cfg)
	return string(b)
}

func (a *App) SaveNetworkConfig(cfgJSON string) error {
	var cfg NetworkConfig
	if err := json.Unmarshal([]byte(cfgJSON), &cfg); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	SetSetting("proxy_pool", cfg.ProxyPool)
	SetSetting("rotation_mode", cfg.RotationMode)
	SetSetting("rotation_value", cfg.RotationValue)
	SetSetting("dns_mode", cfg.DnsMode)
	SetSetting("dns_value", cfg.DnsValue)
	SetSetting("ja3_profile", cfg.Ja3Profile)

	// Reload pool
	LoadProxyPool()
	return nil
}

func saveSetting(a *App, key, value string) {
	SetSetting(key, value)
}

// ─── DNS Resolver ────────────────────────────────────────────────────────────

// GetCustomResolver returns a net.Resolver based on DNS settings
func GetCustomResolver() *net.Resolver {
	mode := GetSetting("dns_mode", "system")
	value := GetSetting("dns_value", "")

	switch mode {
	case "custom_ip":
		if value == "" {
			return nil
		}
		addr := value
		if !strings.Contains(addr, ":") {
			addr += ":53"
		}
		return &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{Timeout: 5 * time.Second}
				return d.DialContext(ctx, "udp", addr)
			},
		}

	case "doh":
		// DNS over HTTPS — use custom dialer that resolves via DoH
		// For now, use a simple approach: resolve via DoH then dial
		if value == "" {
			return nil
		}
		log.Printf("[DNS] DoH resolver configured: %s", value)
		// DoH implementation will be in dns.go
		return nil

	case "dot":
		// DNS over TLS
		if value == "" {
			return nil
		}
		log.Printf("[DNS] DoT resolver configured: %s", value)
		return nil

	default:
		return nil // system default
	}
}
