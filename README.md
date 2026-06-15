# Meowl

Meowl is a high-performance, cross-platform HTTP/S interception proxy and security analysis tool. It features a modern web interface integrated with a robust Go backend.

## 🏗️ Architecture

### Backend (Go)
- **Wails Framework**: Desktop application framework
- **HTTP API**: RESTful API on port 8000
- **WebSocket Hub**: Real-time updates to frontend
- **Go Proxy Engine**: HTTP/HTTPS interception on port 8081
- **SQLite Database**: Request/response history with WAL mode

### Frontend (React)
- **React 19**: UI framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling
- **Radix UI**: Component library
- **Zustand**: State management

### Data Flow
```
Browser → System Proxy (8082) → Go Proxy Engine (8081)
  ↓
Apply Request Rules → Forward to Target Server
  ↓
Receive Response → Apply Response Rules
  ↓
Save to SQLite → Broadcast via WebSocket
  ↓
Frontend Updates UI in Real-time
```

## 📊 Key Features

- **HTTP/HTTPS Interception**: Full support for HTTP/1.1, HTTP/2, and WebSocket
- **Request/Response Modification**: Apply rules to modify traffic
- **History Management**: SQLite-backed persistent storage
- **Real-time Updates**: WebSocket-based live UI updates
- **Repeater**: Resend requests with modifications
- **Rules Engine**: Automate traffic modification
- **Cross-platform**: Windows, Linux, macOS support

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get captured requests |
| GET | `/api/intercepts` | Get intercepted requests |
| POST | `/api/clear` | Clear history |
| POST | `/api/delete` | Delete specific requests |
| GET/POST | `/api/rules` | Manage rules |
| POST | `/api/resend` | Resend a request |
| POST | `/api/restart-proxy` | Restart proxy engine |
| WS | `/ws` | WebSocket for real-time updates |

## 📝 Technology Stack

**Backend:**
- Go 1.25.0
- Wails v2.11.0
- goproxy v1.8.2
- gorilla/websocket v1.5.3
- modernc.org/sqlite v1.46.1

**Frontend:**
- React 19.2.0
- Vite 7.3.1
- TypeScript 5.9.3
- Tailwind CSS 4.2.1
- Radix UI
- Zustand 5.0.11

## 📂 Project Structure

```
meowl/
├── backend/                    # Go backend (Wails app, proxy engine, API)
│   ├── app.go                 # Wails application lifecycle
│   ├── db.go                  # SQLite database layer
│   ├── hub.go                 # WebSocket hub for real-time updates
│   ├── proxy_engine.go        # HTTP/HTTPS proxy engine
│   ├── types.go               # Data types
│   ├── history.db             # SQLite database (WAL mode)
│   └── traffic/               # Protocol Buffers definitions
├── frontend/                   # React + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── components/proxy/      # Main application components
│   │   ├── components/ui/         # Reusable UI components (Radix UI)
│   │   ├── lib/                   # Utilities and state management
│   │   └── hooks/                 # React hooks
│   ├── package.json
│   └── vite.config.ts
├── main.go                     # Application entry point
├── meowl.py                    # Build and run script
├── wails.json                  # Wails configuration
├── config.json                 # Application configuration
├── go.mod / go.sum            # Go dependencies
└── README.md                   # This file
```

## 🛠️ Setup & Installation

### Prerequisites

- **Go**: 1.22+
- **Node.js**: 20+ (npm)
- **Python**: 3.10+ (for build script)
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/meowl.git
   cd meowl
   ```

2. **Install dependencies** (first time only):
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Run in development mode**:
   ```bash
   python meowl.py
   ```

4. **Build for distribution**:
   ```bash
   # Windows
   python meowl.py --rebuild exe

   # Linux (Debian)
   python meowl.py --rebuild deb

   # macOS
   python meowl.py --rebuild dmg
   ```

### Build Script Commands

```bash
# Development mode (default)
python meowl.py

# Full rebuild with platform-specific format
python meowl.py --rebuild

# Rebuild with specific format
python meowl.py --rebuild exe      # Windows
python meowl.py --rebuild deb      # Debian/Ubuntu
python meowl.py --rebuild rpm      # RedHat/CentOS
python meowl.py --rebuild dmg      # macOS
python meowl.py --rebuild appimage # Linux AppImage

# Run built application
python meowl.py --run

# Build frontend only
python meowl.py --frontend-only

# Build backend only
python meowl.py --backend-only

# Clean build artifacts
python meowl.py --clean
```

## ⚙️ Configuration

### Proxy Settings
- **Proxy Port**: By default, the proxy listens on `127.0.0.1:8082`
- **API Server**: Internal API on `127.0.0.1:8000`
- **Proxy Engine**: Go proxy on `127.0.0.1:8081`

### System Proxy
Meowl attempts to manage the system proxy automatically. If manual configuration is needed, point your browser to `127.0.0.1:8082`.

### HTTPS Interception
To intercept encrypted traffic, install the CA certificate from `.mitmproxy/mitmproxy-ca-cert.cer` into your browser's Trusted Root Certification Authorities.

### Configuration Files
- **config.json**: Application settings (port, host)
- **wails.json**: Wails framework configuration

## 📜 License

This project is licensed under the MIT License.
