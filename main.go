package main

import (
	"embed"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"meowl/backend"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

var wshub *backend.Hub

func main() {
	// Redirect logs to file
	logFile, logErr := os.OpenFile("backend_debug.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if logErr == nil {
		log.SetOutput(logFile)
	}

	// Initialize SQLite with the database in the backend folder
	backend.InitDB("backend/history.db")

	// Initialize WebSocket Hub
	wshub = backend.NewHub()
	go wshub.Run()

	// Start Go-based Proxy Engine (Port 8081)
	go backend.StartGoProxy(wshub, 8081)

	// Start Wails App Window
	app := backend.NewApp()

	// HTTP API & WebSockets offloaded to background goroutine
	go func() {
		mux := http.NewServeMux()
		handler := corsMiddleware(mux)

		mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
			backend.ServeWs(wshub, w, r)
		})

		mux.HandleFunc("/api/history", func(w http.ResponseWriter, r *http.Request) {
			history := backend.GetHistory()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(history)
		})

		mux.HandleFunc("/api/intercepts", func(w http.ResponseWriter, r *http.Request) {
			intercepts := backend.GetIntercepts()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(intercepts)
		})

		mux.HandleFunc("/api/clear", func(w http.ResponseWriter, r *http.Request) {
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			backend.ClearHistory()
			wshub.Broadcast <- backend.WSMessage{Type: "history_cleared", Data: nil}
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"ok": true}`))
		})

		mux.HandleFunc("/api/delete", func(w http.ResponseWriter, r *http.Request) {
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			var req struct {
				UIDs []string `json:"uids"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.UIDs) == 0 {
				http.Error(w, "Invalid request", http.StatusBadRequest)
				return
			}
			backend.DeleteRequests(req.UIDs)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"ok": true}`))
		})

		mux.HandleFunc("/api/rules", func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "GET" {
				rules := backend.GetRules()
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(rules)
				return
			}
			if r.Method == "POST" {
				var rules []backend.Rule
				if err := json.NewDecoder(r.Body).Decode(&rules); err != nil {
					http.Error(w, "Invalid request", http.StatusBadRequest)
					return
				}
				if err := backend.SaveRules(rules); err != nil {
					http.Error(w, "Failed to save rules", http.StatusInternalServerError)
					return
				}
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"ok": true}`))
				return
			}
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		})

		mux.HandleFunc("/api/resend", backend.HandleResend)
		mux.HandleFunc("/api/wappalyzer", backend.HandleWappalyzer)

		mux.HandleFunc("/api/cert", func(w http.ResponseWriter, r *http.Request) {
			certData := backend.GetCACert()
			w.Header().Set("Content-Type", "application/x-x509-ca-cert")
			w.Header().Set("Content-Disposition", `attachment; filename="meowl-ca.pem"`)
			w.Write([]byte(certData))
		})

		mux.HandleFunc("/api/restart-proxy", func(w http.ResponseWriter, r *http.Request) {
			if r.Method != "POST" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			app.RestartProxy()
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"ok": true}`))
		})

		log.Println("Internal API & WS started on 127.0.0.1:8000")
		http.ListenAndServe("127.0.0.1:8000", handler)
	}()

	err := wails.Run(&options.App{
		Title:            "Meowl",
		Width:            1400,
		Height:           900,
		Frameless:        true,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 10, G: 14, B: 19, A: 255},
		OnStartup:        app.Startup,
		OnShutdown:       app.Shutdown,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: false,
		},
	})

	if err != nil {
		log.Fatal("Error starting Wails:", err.Error())
	}
}

// corsMiddleware adds basic CORS headers for Vite local dev
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
