package backend

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
	cmd *exec.Cmd
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("[Wails] App started with Go Proxy Engine.")
	InitTitus(ctx)
}

// Shutdown is called when the app closes
func (a *App) Shutdown(ctx context.Context) {
	log.Println("[Wails] Shutting down and restoring Windows Proxy...")
	// Force-disable Windows System Proxy
	exec.Command("reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f").Run()
}

// HandleResend handles resending requests from history
func HandleResend(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UID        string `json:"uid"`
		RawRequest string `json:"raw_request"`
		Host       string `json:"host"`
		UseTLS     bool   `json:"use_tls"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	resp, err := ResendRequest(req.RawRequest, req.Host, req.UseTLS)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":       true,
		"response": resp,
	})
}

// RestartProxy restarts the Go proxy engine with current settings
func (a *App) RestartProxy() {
	log.Println("[Wails] Restarting Go proxy engine...")
	_, port := GetProxySettings()
	StopGoProxy()
	StartGoProxy(currentHub, port)
}

// GetProxySettings returns the current proxy host and port
func (a *App) GetProxySettings() map[string]interface{} {
	addr, port := GetProxySettings()
	return map[string]interface{}{
		"address": addr,
		"port":    port,
	}
}

// SetProxySettings updates the proxy port and restarts the engine
func (a *App) SetProxySettings(port int) bool {
	log.Printf("[Wails] Updating proxy port to %d", port)
	StopGoProxy()
	StartGoProxy(currentHub, port)
	return true
}

// RegenerateCA triggers Root CA regeneration
func (a *App) RegenerateCA() string {
	err := RegenerateCA()
	if err != nil {
		return "Error: " + err.Error()
	}
	return "Success"
}

// GetCACert returns the PEM encoded CA certificate
func (a *App) GetCACert() string {
	return GetCACert()
}

// ResendRequest allows frontend to fire a standalone request
func (a *App) ResendRequest(rawReq string, targetHost string, useTLS bool) string {
	resp, err := ResendRequest(rawReq, targetHost, useTLS)
	if err != nil {
		return "Error: " + err.Error()
	}
	return resp
}

// GetRules returns all configured match/replace rules
func (a *App) GetRules() []Rule {
	return GetRules()
}

// SaveRules persists match/replace rules to the database
func (a *App) SaveRules(rules []Rule) string {
	err := SaveRules(rules)
	if err != nil {
		return "Error: " + err.Error()
	}
	return "Success"
}

// GetScopeRules returns all configured scope rules
func (a *App) GetScopeRules() []ScopeRule {
	return GetScopeRules()
}

// SaveScopeRules persists scope rules to the database
func (a *App) SaveScopeRules(rules []ScopeRule) string {
	err := SaveScopeRules(rules)
	if err != nil {
		return "Error: " + err.Error()
	}
	return "Success"
}

// SelectImage opens a file dialog and returns the selected image as a base64 data URL
func (a *App) SelectImage() string {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Background Image",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Images (*.jpg, *.png, *.webp, *.gif)",
				Pattern:     "*.jpg;*.jpeg;*.png;*.webp;*.gif",
			},
		},
	})

	if err != nil || filePath == "" {
		return ""
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Failed to read image file: %v", err)
		return ""
	}

	ext := filepath.Ext(filePath)
	var mimeType string
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	case ".webp":
		mimeType = "image/webp"
	case ".gif":
		mimeType = "image/gif"
	default:
		mimeType = "image/octet-stream"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded)
}

// GetSetting retrieves a persistent setting
func (a *App) GetSetting(key string, defaultValue string) string {
	return GetSetting(key, defaultValue)
}

// SetSetting saves a persistent setting
func (a *App) SetSetting(key string, value string) string {
	err := SetSetting(key, value)
	if err != nil {
		return "Error: " + err.Error()
	}
	return "Success"
}

