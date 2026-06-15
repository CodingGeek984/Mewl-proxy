package backend

import (
	"log"
	"meowl/backend/traffic"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for dev
}

// Hub maintains the set of active websocket clients and broadcasts messages to the clients.
type Hub struct {
	Clients         map[*websocket.Conn]bool
	Broadcast       chan WSMessage
	Register        chan *websocket.Conn
	Unregister      chan *websocket.Conn
	ControlCommands chan *traffic.ControlSignal
	mu              sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:       make(chan WSMessage, 10000), // Buffer large bursts
		Register:        make(chan *websocket.Conn),
		Unregister:      make(chan *websocket.Conn),
		ControlCommands: make(chan *traffic.ControlSignal, 100),
		Clients:         make(map[*websocket.Conn]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				client.Close()
			}
			h.mu.Unlock()
		case message := <-h.Broadcast:
			h.mu.Lock()
			for client := range h.Clients {
				var err error
				if len(message.BinaryData) > 0 {
					err = client.WriteMessage(websocket.BinaryMessage, message.BinaryData)
				} else {
					err = client.WriteJSON(message)
				}
				if err != nil {
					client.Close()
					delete(h.Clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

// ServeWs handles websocket requests from the peer.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	hub.Register <- conn

	// Initial connect payload
	conn.WriteJSON(WSMessage{Type: "connected"})

	go func() {
		defer func() {
			hub.Unregister <- conn
		}()
		for {
			var msg map[string]interface{}
			err := conn.ReadJSON(&msg)
			if err != nil {
				break
			}
			// Handle client messages like "clear_history"
			if typ, ok := msg["type"].(string); ok {
				if typ == "clear_history" {
					ClearHistory()
					hub.Broadcast <- WSMessage{Type: "history_cleared"}
				} else if typ == "set_breakpoints" {
					// Client wants to set breakpoint states
					request, _ := msg["request"].(bool)
					response, _ := msg["response"].(bool)
					log.Printf("[Hub] Setting breakpoints: request=%v, response=%v", request, response)
					SetBreakpoints(request, response)
				} else if typ == "intercept_action" {
					// Client wants to forward, drop, or toggle intercept
					action, _ := msg["action"].(string) // "on", "off", "forward", "drop"
					uid, _ := msg["uid"].(string)
					payload, _ := msg["payload"].(string)

					log.Printf("[Hub] Received intercept_action: action=%s, uid=%s, hasPayload=%v", action, uid, payload != "")

					var cmdType traffic.ControlSignal_Type
					if action == "on" {
						cmdType = traffic.ControlSignal_INTERCEPT_ON
						log.Println("[Hub] Enabling intercept")
					} else if action == "off" {
						cmdType = traffic.ControlSignal_INTERCEPT_OFF
						log.Println("[Hub] Disabling intercept")
					} else if action == "forward" {
						cmdType = traffic.ControlSignal_RELEASE_REQUEST
						log.Printf("[Hub] Forwarding intercept: %s", uid)
					} else if action == "drop" {
						cmdType = traffic.ControlSignal_DROP_REQUEST
						log.Printf("[Hub] Dropping intercept: %s", uid)
					} else if action == "intercept_response" {
						cmdType = traffic.ControlSignal_RELEASE_AND_INTERCEPT_RESPONSE
						log.Printf("[Hub] Release and Intercept Response for: %s", uid)
					} else {
						cmdType = traffic.ControlSignal_RELEASE_REQUEST
					}

					cmd := &traffic.ControlSignal{
						Type:      cmdType,
						TargetUid: uid,
						Payload:   payload,
					}
					// Non-blocking send
					select {
					case hub.ControlCommands <- cmd:
						log.Printf("[Hub] Control signal queued: %v", cmdType)
					default:
						log.Println("Warning: ControlCommands channel full, dropping signal")
					}
				}
			}
		}
	}()
}
