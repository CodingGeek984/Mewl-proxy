package backend

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"

	wappalyzer "github.com/projectdiscovery/wappalyzergo"
)

// WappalyzerTech represents a detected technology
type WappalyzerTech struct {
	Name       string   `json:"name"`
	Categories []string `json:"categories,omitempty"`
}

// WappalyzerResult is the full scan result sent to the frontend
type WappalyzerResult struct {
	URL          string           `json:"url"`
	Technologies []WappalyzerTech `json:"technologies"`
	Error        string           `json:"error,omitempty"`
}

// HandleWappalyzer handles GET /api/wappalyzer?url=https://example.com
func HandleWappalyzer(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(WappalyzerResult{Error: "url parameter is required"})
		return
	}

	// Ensure URL has a scheme
	if !strings.HasPrefix(targetURL, "http://") && !strings.HasPrefix(targetURL, "https://") {
		targetURL = "https://" + targetURL
	}

	// Fetch the target
	client := &http.Client{}
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(WappalyzerResult{URL: targetURL, Error: "invalid URL: " + err.Error()})
		return
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; Meowl/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(WappalyzerResult{URL: targetURL, Error: "fetch failed: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024)) // 2MB limit
	if err != nil {
		log.Printf("[Wappalyzer] Error reading body for %s: %v", targetURL, err)
	}

	// Create wappalyzer client
	wapClient, err := wappalyzer.New()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(WappalyzerResult{URL: targetURL, Error: "wappalyzer init failed: " + err.Error()})
		return
	}

	// Run detection
	techWithInfo := wapClient.FingerprintWithInfo(resp.Header, body)

	// Build response
	techs := make([]WappalyzerTech, 0, len(techWithInfo))
	for name, info := range techWithInfo {
		techs = append(techs, WappalyzerTech{
			Name:       name,
			Categories: info.Categories,
		})
	}

	// Sort by name
	sort.Slice(techs, func(i, j int) bool {
		return techs[i].Name < techs[j].Name
	})

	json.NewEncoder(w).Encode(WappalyzerResult{
		URL:          targetURL,
		Technologies: techs,
	})
}
