package backend

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"meowl/backend/traffic"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"google.golang.org/protobuf/proto"
)

type FuzzPayloadConfig struct {
	Type         string `json:"type"`
	SimpleText   string `json:"simpleText"`
	NumFrom      int    `json:"numFrom"`
	NumTo        int    `json:"numTo"`
	NumStep      int    `json:"numStep"`
	NumBase      int    `json:"numBase"`
	NumMinInt    int    `json:"numMinInt"`
	NumMaxInt    int    `json:"numMaxInt"`
	BruteMin     int    `json:"bruteMin"`
	BruteMax     int    `json:"bruteMax"`
	BruteCharset string `json:"bruteCharset"`
	NullCount    int    `json:"nullCount"`
}

type FuzzOptions struct {
	SessionID      string              `json:"session_id"`
	TargetURL      string              `json:"target_url"`
	RawRequest     string              `json:"raw_request"`
	PayloadConfigs []FuzzPayloadConfig `json:"payload_configs"`
	AttackType     string              `json:"attack_type"`
	FuzzKeyword    string              `json:"fuzz_keyword"`
	Threads        int                 `json:"threads"`
	TimeoutMs      int                 `json:"timeout_ms"`
	DelayMs        int                 `json:"delay_ms"`
}

type FuzzResult struct {
	SessionID  string `json:"session_id"`
	ID         string `json:"id"`
	Payload    string `json:"payload"`
	Status     int    `json:"status"`
	Length     int    `json:"length"`
	Words      int    `json:"words"`
	Lines      int    `json:"lines"`
	TimeMs     int    `json:"time_ms"`
	Reflection bool   `json:"reflection"`
	Error      string `json:"error,omitempty"`
}

type FuzzResponseStore struct {
	RawRequest  string `json:"rawRequest"`
	RawResponse string `json:"rawResponse"`
}

var (
	fuzzCancelFunc context.CancelFunc
	fuzzMu         sync.Mutex
	httpClient     *http.Client
	
	// Pause Mechanism
	fuzzPaused   bool
	fuzzCond     = sync.NewCond(&fuzzMu)
	
	// Response Caching
	fuzzStoreMu  sync.RWMutex
	fuzzStore    = make(map[string]FuzzResponseStore) // keyed by ID
)

func init() {
	tr := &http.Transport{
		TLSClientConfig:   &tls.Config{InsecureSkipVerify: true},
		DisableKeepAlives: false,
		MaxIdleConns:      1000,
		MaxIdleConnsPerHost: 100,
	}
	httpClient = &http.Client{
		Transport: tr,
	}
}

// GetFuzzResponse allows the frontend to request the full raw payload for inspector
func (a *App) GetFuzzResponse(id string) map[string]interface{} {
	fuzzStoreMu.RLock()
	defer fuzzStoreMu.RUnlock()
	res, ok := fuzzStore[id]
	if !ok {
		return map[string]interface{}{"ok": false}
	}
	return map[string]interface{}{
		"ok":          true,
		"rawRequest":  res.RawRequest,
		"rawResponse": res.RawResponse,
	}
}

// StartFuzzer initiates the background Intruder engine
func (a *App) StartFuzzer(opts FuzzOptions) error {
	return StartFuzzerEngine(a.ctx, opts)
}

// StopFuzzer halts the background Intruder engine
func (a *App) StopFuzzer() error {
	return StopFuzzerEngine()
}

// PauseFuzzer safely pauses the worker loops
func (a *App) PauseFuzzer() error {
	fuzzMu.Lock()
	fuzzPaused = true
	fuzzMu.Unlock()
	return nil
}

// ResumeFuzzer resumes the worker loops
func (a *App) ResumeFuzzer() error {
	fuzzMu.Lock()
	fuzzPaused = false
	fuzzCond.Broadcast()
	fuzzMu.Unlock()
	return nil
}


// Wait if paused
func checkPauseBlock(ctx context.Context) bool {
	fuzzMu.Lock()
	defer fuzzMu.Unlock()
	
	for fuzzPaused {
		// Cannot simply block forever without checking ctx, so using a small sleep workaround or purely relying on Cond wrapper if robust.
		// Go's sync.Cond doesn't natively accept context. We will poll gracefully.
		fuzzMu.Unlock()
		select {
		case <-ctx.Done():
			fuzzMu.Lock()
			return false
		case <-time.After(50 * time.Millisecond):
		}
		fuzzMu.Lock()
	}
	return true
}

// --- Generator Interfaces ---

type PayloadGenerator interface {
	Next() (string, bool)
	Reset()
}

// Simple List
type SimpleListGen struct {
	lines []string
	idx   int
}
func (g *SimpleListGen) Next() (string, bool) {
	if g.idx >= len(g.lines) { return "", false }
	v := g.lines[g.idx]
	g.idx++
	return v, true
}
func (g *SimpleListGen) Reset() { g.idx = 0 }

// Brute Forcer
type BruteGen struct {
	charset string
	min     int
	max     int
	indices []int
	done    bool
}
func (g *BruteGen) Reset() {
	g.indices = make([]int, g.min)
	g.done = false
}
func (g *BruteGen) Next() (string, bool) {
	if g.done { return "", false }
	var sb strings.Builder
	for _, idx := range g.indices {
		sb.WriteByte(g.charset[idx])
	}
	res := sb.String()

	pos := len(g.indices) - 1
	for pos >= 0 {
		g.indices[pos]++
		if g.indices[pos] < len(g.charset) {
			break
		}
		g.indices[pos] = 0
		pos--
	}
	if pos < 0 {
		if len(g.indices) < g.max {
			g.indices = make([]int, len(g.indices)+1)
		} else {
			g.done = true
		}
	}
	return res, true
}

// Numbers Generator
type NumGen struct {
	from, to, step, base, minInt, maxInt int
	current                              int
	done                                 bool
}
func (g *NumGen) Reset() { g.current = g.from; g.done = false }
func (g *NumGen) Next() (string, bool) {
	if g.done { return "", false }
	step := g.step
	if step == 0 { step = 1 }

	format := "%d"
	if g.base == 16 { format = "%x" }
	s := fmt.Sprintf(format, g.current)
	if g.minInt > 0 {
		for len(s) < g.minInt { s = "0" + s }
	}
	if g.maxInt > 0 && len(s) > g.maxInt {
		s = s[len(s)-g.maxInt:]
	}

	if g.from <= g.to {
		g.current += step
		if g.current > g.to { g.done = true }
	} else {
		g.current -= step
		if g.current < g.to { g.done = true }
	}
	return s, true
}

// Null Generator
type NullGen struct {
	count int
	idx   int
}
func (g *NullGen) Reset() { g.idx = 0 }
func (g *NullGen) Next() (string, bool) {
	if g.idx >= g.count { return "", false }
	g.idx++
	return "", true
}

// Build Generator
func buildGenerator(cfg FuzzPayloadConfig) PayloadGenerator {
	switch cfg.Type {
	case "Simple list":
		lines := strings.Split(cfg.SimpleText, "\n")
		// Trim and remove completely empty lines safely
		var clean []string
		for _, l := range lines {
			l = strings.TrimSpace(l)
			if l != "" { clean = append(clean, l) }
		}
		return &SimpleListGen{lines: clean}
	case "Numbers":
		return &NumGen{from: cfg.NumFrom, to: cfg.NumTo, step: cfg.NumStep, base: cfg.NumBase, minInt: cfg.NumMinInt, maxInt: cfg.NumMaxInt, current: cfg.NumFrom}
	case "Brute forcer":
		charset := cfg.BruteCharset
		if charset == "" { charset = "a" }
		min := cfg.BruteMin
		max := cfg.BruteMax
		if min < 1 { min = 1 }
		if max < min { max = min }
		return &BruteGen{charset: charset, min: min, max: max, indices: make([]int, min)}
	case "Null payloads":
		return &NullGen{count: cfg.NullCount}
	}
	return &SimpleListGen{lines: []string{""}}
}

// --- Engine Core ---

func StartFuzzerEngine(ctx context.Context, opts FuzzOptions) error {
	fuzzMu.Lock()
	defer fuzzMu.Unlock()

	if fuzzCancelFunc != nil {
		fuzzCancelFunc()
	}

	fuzzStoreMu.Lock()
	fuzzStore = make(map[string]FuzzResponseStore) // Clear old UI cache
	fuzzStoreMu.Unlock()

	fuzzPaused = false
	fuzzCtx, cancel := context.WithCancel(ctx)
	fuzzCancelFunc = cancel

	tmo := opts.TimeoutMs
	if tmo <= 0 { tmo = 10000 }
	httpClient.Timeout = time.Duration(tmo) * time.Millisecond

	rMarkers := regexp.MustCompile(`(§.*?§)`)
	matches := rMarkers.FindAllStringIndex(opts.RawRequest, -1)
	markersCount := len(matches)

	go func() {
		defer cancel()
		defer runtime.EventsEmit(ctx, "fuzzer_done")

		if markersCount == 0 {
			if opts.AttackType == "sniper" && len(opts.PayloadConfigs) > 0 {
				gen := buildGenerator(opts.PayloadConfigs[0])
				runBasicKeywordSniper(fuzzCtx, ctx, opts, gen)
			}
			return
		}

		gens := make([]PayloadGenerator, len(opts.PayloadConfigs))
		for i, cfg := range opts.PayloadConfigs {
			gens[i] = buildGenerator(cfg)
		}

		switch opts.AttackType {
		case "sniper":
			if len(gens) > 0 { runIntruderSniper(fuzzCtx, ctx, opts, matches, gens[0]) }
		case "battering ram":
			if len(gens) > 0 { runIntruderBatteringRam(fuzzCtx, ctx, opts, matches, gens[0]) }
		case "pitchfork":
			runIntruderPitchfork(fuzzCtx, ctx, opts, matches, gens)
		case "cluster bomb":
			runIntruderClusterBomb(fuzzCtx, ctx, opts, matches, gens)
		}
	}()

	return nil
}

func StopFuzzerEngine() error {
	fuzzMu.Lock()
	defer fuzzMu.Unlock()
	if fuzzCancelFunc != nil {
		fuzzCancelFunc()
		fuzzCancelFunc = nil
	}
	fuzzPaused = false
	fuzzCond.Broadcast() // Unblock if stuck
	return nil
}


func fireRequest(fuzzCtx context.Context, wailsCtx context.Context, opts FuzzOptions, rawReq string, payloads []string) {
	if !checkPauseBlock(fuzzCtx) { return }

	if opts.DelayMs > 0 {
		select {
		case <-fuzzCtx.Done(): return
		case <-time.After(time.Duration(opts.DelayMs) * time.Millisecond):
		}
	}

	start := time.Now()
	payloadStr := strings.Join(payloads, " | ")
	
	lines := strings.SplitN(rawReq, "\n", 2)
	if len(lines) < 2 { return }
	requestLine := strings.Split(strings.TrimSpace(lines[0]), " ")
	method := "GET"
	reqPath := "/"
	if len(requestLine) >= 2 {
		method = requestLine[0]
		reqPath = requestLine[1]
	}

	u, err := url.Parse(opts.TargetURL)
	if err != nil { return }
	fullURL := fmt.Sprintf("%s://%s%s", u.Scheme, u.Host, reqPath)

	bodyParts := strings.SplitN(rawReq, "\r\n\r\n", 2)
	if len(bodyParts) < 2 {
		bodyParts = strings.SplitN(rawReq, "\n\n", 2)
	}
	var reqBody io.Reader
	if len(bodyParts) > 1 && strings.TrimSpace(bodyParts[1]) != "" {
		reqBody = strings.NewReader(bodyParts[1])
	}

	// 3 Retries mechanism
	var resp *http.Response
	var duration int64
	var req *http.Request
	
	for attempt := 0; attempt < 3; attempt++ {
		req, err = http.NewRequestWithContext(fuzzCtx, method, fullURL, reqBody)
		if err != nil { break }

		headerLines := strings.Split(bodyParts[0], "\n")[1:]
		for _, line := range headerLines {
			line = strings.TrimSpace(line)
			if line == "" { continue }
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				if strings.ToLower(key) != "host" && strings.ToLower(key) != "content-length" {
					req.Header.Add(key, val)
				}
			}
		}

		startCall := time.Now()
		resp, err = httpClient.Do(req)
		duration = time.Since(startCall).Milliseconds()

		if err == nil { break }
		
		if fuzzCtx.Err() != nil { return } // Canceled completely
		
		// If error is timeout or reset, wait 500ms and try again
		time.Sleep(500 * time.Millisecond)
	}

	uid := fmt.Sprintf("req_%d_%d", time.Now().UnixNano(), len(fuzzStore))

	if err != nil {
		runtime.EventsEmit(wailsCtx, "fuzzer_result", FuzzResult{SessionID: opts.SessionID, ID: uid, Payload: payloadStr, TimeMs: int(time.Since(start).Milliseconds()), Error: err.Error()})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	text := string(bodyBytes)
	words := len(strings.Fields(text))
	respLines := len(strings.Split(text, "\n"))

	// Format Request Dump
	var reqDump strings.Builder
	reqDump.WriteString(fmt.Sprintf("%s %s HTTP/1.1\r\n", req.Method, req.URL.RequestURI()))
	reqDump.WriteString(fmt.Sprintf("Host: %s\r\n", req.Host))
	for k, v := range req.Header {
		for _, v2 := range v {
			reqDump.WriteString(fmt.Sprintf("%s: %s\r\n", k, v2))
		}
	}
	reqDump.WriteString("\r\n")
	if len(bodyParts) > 1 { reqDump.WriteString(bodyParts[1]) }

	// Format Response Dump
	var resDump strings.Builder
	resDump.WriteString(fmt.Sprintf("%s %s\r\n", resp.Proto, resp.Status))
	for k, v := range resp.Header {
		for _, v2 := range v {
			resDump.WriteString(fmt.Sprintf("%s: %s\r\n", k, v2))
		}
	}
	resDump.WriteString("\r\n")
	resDump.WriteString(text)

	// Save to memory cache
	fuzzStoreMu.Lock()
	fuzzStore[uid] = FuzzResponseStore{
		RawRequest:  reqDump.String(),
		RawResponse: resDump.String(),
	}
	fuzzStoreMu.Unlock()

	// Insert into HTTP History with Source="iterator"
	dbEvent := TrafficEvent{
		UID: uid, Method: method, Host: u.Host, Path: reqPath, Query: req.URL.RawQuery,
		StatusCode: resp.StatusCode, MimeType: resp.Header.Get("Content-Type"), Size: int64(len(bodyBytes)),
		Protocol: resp.Proto, TLS: u.Scheme == "https", ServerIP: getIPCached(u.Host), SourceIP: "127.0.0.1",
		RequestRaw: reqDump.String(), ResponseRaw: resDump.String(), Latency: int(duration), Source: "iterator",
		Time: start.Format("15:04:05"), StartTime: start.Format(time.RFC3339), EndTime: time.Now().Format(time.RFC3339),
	}
	InsertRequest(&dbEvent)
	if currentHub != nil {
		protoEvent := &traffic.TrafficEvent{
			Uid: uid, Id: uint32(dbEvent.ID), Method: method, Host: u.Host, Path: reqPath,
			StatusCode: int32(resp.StatusCode), MimeType: dbEvent.MimeType, Size: dbEvent.Size,
			Protocol: resp.Proto, Tls: u.Scheme == "https", Latency: int32(duration), Source: "iterator",
		}
		batch := &traffic.WSBatch{Events: []*traffic.TrafficEvent{protoEvent}}
		if data, bErr := proto.Marshal(batch); bErr == nil { currentHub.Broadcast <- WSMessage{Type: "new_traffic_bin", BinaryData: data} }
	}

	// Detect reflection: does the payload appear in the response body?
	reflection := false
	for _, p := range payloads {
		if p != "" && strings.Contains(text, p) {
			reflection = true
			break
		}
	}

	res := FuzzResult{
		SessionID:  opts.SessionID,
		ID:         uid,
		Payload:    payloadStr,
		Status:     resp.StatusCode,
		Length:     len(bodyBytes),
		Words:      words,
		Lines:      respLines,
		TimeMs:     int(duration),
		Reflection: reflection,
	}

	if fuzzCtx.Err() == nil {
		runtime.EventsEmit(wailsCtx, "fuzzer_result", res)
	}
}


func createRequest(baseReq string, matches [][]int, payloads []string) string {
	var builder strings.Builder
	lastIdx := 0
	for i, match := range matches {
		builder.WriteString(baseReq[lastIdx:match[0]])
		if i < len(payloads) {
			builder.WriteString(payloads[i])
		} else {
			markerText := baseReq[match[0]+1:match[1]-1]
			builder.WriteString(markerText)
		}
		lastIdx = match[1]
	}
	builder.WriteString(baseReq[lastIdx:])
	return builder.String()
}

func runIntruderSniper(ctx context.Context, wCtx context.Context, opts FuzzOptions, matches [][]int, gen PayloadGenerator) {
	workerQueue := make(chan struct{}, opts.Threads)
	var wg sync.WaitGroup

	for i := range matches {
		gen.Reset()
		for {
			word, ok := gen.Next()
			if !ok { break }
			if ctx.Err() != nil { return }
			
			wg.Add(1)
			workerQueue <- struct{}{}
			
			payloads := make([]string, len(matches))
			for j, m := range matches {
				if j == i { payloads[j] = word } else { payloads[j] = opts.RawRequest[m[0]+1:m[1]-1] }
			}
			reqText := createRequest(opts.RawRequest, matches, payloads)
			
			go func(req string, w string) {
				defer wg.Done()
				defer func() { <-workerQueue }()
				fireRequest(ctx, wCtx, opts, req, []string{w})
			}(reqText, word)
		}
	}
	wg.Wait()
}

func runIntruderBatteringRam(ctx context.Context, wCtx context.Context, opts FuzzOptions, matches [][]int, gen PayloadGenerator) {
	workerQueue := make(chan struct{}, opts.Threads)
	var wg sync.WaitGroup

	for {
		word, ok := gen.Next()
		if !ok { break }
		if ctx.Err() != nil { return }
		
		wg.Add(1)
		workerQueue <- struct{}{}
		
		payloads := make([]string, len(matches))
		for j := range matches { payloads[j] = word }
		reqText := createRequest(opts.RawRequest, matches, payloads)
		
		go func(req string, w string) {
			defer wg.Done()
			defer func() { <-workerQueue }()
			fireRequest(ctx, wCtx, opts, req, []string{w})
		}(reqText, word)
	}
	wg.Wait()
}

func runIntruderPitchfork(ctx context.Context, wCtx context.Context, opts FuzzOptions, matches [][]int, gens []PayloadGenerator) {
	workerQueue := make(chan struct{}, opts.Threads)
	var wg sync.WaitGroup

	for {
		payloads := make([]string, len(matches))
		allDone := true
		
		for j := range matches {
			if j < len(gens) {
				word, ok := gens[j].Next()
				if !ok { payloads[j] = ""; continue }
				payloads[j] = word
				allDone = false
			} else {
				payloads[j] = opts.RawRequest[matches[j][0]+1:matches[j][1]-1]
			}
		}
		
		if allDone { break } // Shortest list stops the generator or when all are exhausted? Pitchfork stops at shortest usually... Wait, if one returns false, we should abort!
		
		// To match burp pitchfork, if at least one generator is empty, pitchfork stops. Let's enforce shortest list:
		hasEmpty := false
		for j := range gens {
			if payloads[j] == "" { hasEmpty = true }
		}
		if hasEmpty && len(gens) > 0 { break }

		if ctx.Err() != nil { return }
		
		wg.Add(1)
		workerQueue <- struct{}{}
		
		reqText := createRequest(opts.RawRequest, matches, payloads)
		
		go func(req string, pl []string) {
			defer wg.Done()
			defer func() { <-workerQueue }()
			fireRequest(ctx, wCtx, opts, req, pl)
		}(reqText, append([]string(nil), payloads...))
	}
	wg.Wait()
}


func runIntruderClusterBomb(ctx context.Context, wCtx context.Context, opts FuzzOptions, matches [][]int, gens []PayloadGenerator) {
	if len(gens) == 0 { return }
	workerQueue := make(chan struct{}, opts.Threads)
	var wg sync.WaitGroup

	var recursiveCombine func(setIndex int, currentPayloads []string)
	recursiveCombine = func(setIndex int, currentPayloads []string) {
		if ctx.Err() != nil { return }
		if setIndex == len(gens) || setIndex == len(matches) {
			wg.Add(1)
			workerQueue <- struct{}{}
			
			finalPayloads := make([]string, len(matches))
			for i := range matches {
				if i < len(currentPayloads) { finalPayloads[i] = currentPayloads[i] } else { finalPayloads[i] = opts.RawRequest[matches[i][0]+1:matches[i][1]-1] }
			}
			reqText := createRequest(opts.RawRequest, matches, finalPayloads)
			
			go func(req string, pl []string) {
				defer wg.Done()
				defer func() { <-workerQueue }()
				fireRequest(ctx, wCtx, opts, req, pl)
			}(reqText, append([]string(nil), finalPayloads...))
			
			return
		}
		
		gens[setIndex].Reset()
		for {
			word, ok := gens[setIndex].Next()
			if !ok { break }
			recursiveCombine(setIndex+1, append(currentPayloads, word))
		}
	}

	recursiveCombine(0, []string{})
	wg.Wait()
}

func runBasicKeywordSniper(ctx context.Context, wCtx context.Context, opts FuzzOptions, gen PayloadGenerator) {
	workerQueue := make(chan struct{}, opts.Threads)
	var wg sync.WaitGroup

	for {
		word, ok := gen.Next()
		if !ok { break }
		if ctx.Err() != nil { return }
		
		wg.Add(1)
		workerQueue <- struct{}{}
		
		reqText := strings.ReplaceAll(opts.RawRequest, opts.FuzzKeyword, word)
		
		go func(req string, w string) {
			defer wg.Done()
			defer func() { <-workerQueue }()
			fireRequest(ctx, wCtx, opts, req, []string{w})
		}(reqText, word)
	}
	wg.Wait()
}
