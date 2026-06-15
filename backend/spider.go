package backend

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"

	"github.com/projectdiscovery/katana/pkg/engine/standard"
	"github.com/projectdiscovery/katana/pkg/output"
	"github.com/projectdiscovery/katana/pkg/types"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type SpiderResult struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Source    string `json:"source"`
	Timestamp string `json:"time"`
}

type SpiderConfig struct {
	URL      string `json:"url"`
	Mode     string `json:"mode"` // passive, standard, ajax
	MaxDepth int    `json:"max_depth"`
}

var (
	spiderCtx    context.Context
	spiderCancel context.CancelFunc
	spiderMu     sync.Mutex
)

// StartSpider launches the Katana engine based on the config.
func (a *App) StartSpider(config SpiderConfig) error {
	spiderMu.Lock()
	defer spiderMu.Unlock()

	if spiderCancel != nil {
		spiderCancel()
	}

	spiderCtx, spiderCancel = context.WithCancel(a.ctx)

	log.Printf("[Spider] Starting %s crawl for %s (depth: %d)", config.Mode, config.URL, config.MaxDepth)

	go func() {
		// Default options for standard crawling
		options := &types.Options{
			MaxDepth:     config.MaxDepth,
			FieldScope:   "rdn",          // root domain and subdomains
			BodyReadSize: 2 * 1024 * 1024, // 2MB
			RateLimit:    150,
			Strategy:     "depth-first",
			Timeout:      10,
			Retries:      1,
			ExtensionFilter: []string{
				"css", "jpg", "jpeg", "png", "svg", "gif", "woff", "woff2", "ttf", "eot", "mp4", "mp3", "avi",
			},
		}

		// Route Katana through Meowl's proxy for traffic visibility & rule application
		if currentPort > 0 {
			proxyAddr := fmt.Sprintf("http://127.0.0.1:%d", currentPort)
			options.Proxy = proxyAddr
			log.Printf("[Spider] Routing through Meowl proxy: %s", proxyAddr)
		}

		crawlMode := config.Mode
		if config.Mode == "passive" {
			log.Printf("[Spider] Passive mode: scanning proxy history for %s", config.URL)
			// TODO: extract URLs from stored proxy history matching target domain
		} else if config.Mode == "ajax" || config.Mode == "headless" {
			options.Headless = true
			options.UseInstalledChrome = true
		}

		// Configure output callback to stream results via Wails
		options.OnResult = func(result output.Result) {
			select {
			case <-spiderCtx.Done():
				return
			default:
				if result.Request != nil && result.Request.URL != "" {
					runtime.EventsEmit(a.ctx, "spider_result", map[string]string{
						"id":     result.Timestamp.Format("150405.000"),
						"url":    result.Request.URL,
						"source": result.Request.Source,
						"time":   result.Timestamp.Format("15:04:05"),
						"mode":   crawlMode,
					})
				}
			}
		}

		crawlerOptions, err := types.NewCrawlerOptions(options)
		if err != nil {
			log.Printf("[Spider] Options error: %v", err)
			runtime.EventsEmit(a.ctx, "spider_stopped", map[string]string{"error": err.Error()})
			return
		}

		crawler, err := standard.New(crawlerOptions)
		if err != nil {
			log.Printf("[Spider] Engine init error: %v", err)
			runtime.EventsEmit(a.ctx, "spider_stopped", map[string]string{"error": err.Error()})
			return
		}

		defer crawler.Close()

		err = crawler.Crawl(config.URL)
		if err != nil && !strings.Contains(err.Error(), "context canceled") {
			log.Printf("[Spider] Crawl error: %v", err)
			runtime.EventsEmit(a.ctx, "spider_stopped", map[string]string{"error": err.Error()})
			return
		}

		log.Printf("[Spider] Finished crawl for %s", config.URL)
		runtime.EventsEmit(a.ctx, "spider_stopped", map[string]string{"status": "completed"})
	}()

	return nil
}

func (a *App) StopSpider() error {
	spiderMu.Lock()
	defer spiderMu.Unlock()
	if spiderCancel != nil {
		log.Println("[Spider] Stopping crawler...")
		spiderCancel()
		spiderCancel = nil
	}
	return nil
}
