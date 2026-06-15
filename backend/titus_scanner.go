package backend

import (
	"context"
	"log"

	"github.com/praetorian-inc/titus"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"meowl/backend/traffic"
)

var (
	titusScanner *titus.Scanner
	appCtx       context.Context
)

type TitusMatch struct {
	ReqID    string `json:"req_id"`
	URL      string `json:"url"`
	RuleName string `json:"rule_name"`
	RuleID   string `json:"rule_id"`
	Match    string `json:"match"`
	Source   string `json:"source"`
}

// InitTitus initializes the Praetorian Titus secrets scanner
func InitTitus(ctx context.Context) {
	appCtx = ctx
	scanner, err := titus.NewScanner()
	if err != nil {
		log.Printf("[Titus] Failed to initialize scanner: %v", err)
		return
	}
	titusScanner = scanner
	log.Println("[Titus] Passive secrets scanner initialized")
}

// PassivelyScanTraffic runs the Titus scanner against raw HTTP traffic asynchronously
func PassivelyScanTraffic(event *traffic.TrafficEvent) {
	if titusScanner == nil || appCtx == nil {
		return
	}

	// Run passively in a goroutine
	go func(evt *traffic.TrafficEvent) {
		urlContext := evt.Host + evt.Path

		// Scan Request block
		reqMatches, err := titusScanner.ScanString(evt.RequestRaw)
		if err == nil {
			for _, m := range reqMatches {
				runtime.EventsEmit(appCtx, "titus_alert", TitusMatch{
					ReqID:    evt.Uid,
					URL:      urlContext,
					RuleName: m.RuleName,
					RuleID:   m.RuleID,
					Match:    string(m.Snippet.Matching),
					Source:   "Request",
				})
			}
		}

		// Scan Response block
		resMatches, err := titusScanner.ScanString(evt.ResponseRaw)
		if err == nil {
			for _, m := range resMatches {
				runtime.EventsEmit(appCtx, "titus_alert", TitusMatch{
					ReqID:    evt.Uid,
					URL:      urlContext,
					RuleName: m.RuleName,
					RuleID:   m.RuleID,
					Match:    string(m.Snippet.Matching),
					Source:   "Response",
				})
			}
		}
	}(event)
}
