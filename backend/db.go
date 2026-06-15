package backend

import (
	"database/sql"
	"log"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

var (
	db            *sql.DB
	idMu          sync.Mutex
	globalID      int
	insertStmt    *sql.Stmt
	interceptStmt *sql.Stmt
	rulesMu       sync.Mutex
)

// InitDB initializes SQLite with WAL mode for extreme performance without CGO
func InitDB(path string) {
	var err error
	db, err = sql.Open("sqlite", "file:"+path+"?cache=shared&mode=rwc")
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}

	// High concurrency pragmas
	db.Exec("PRAGMA journal_mode=WAL;")
	db.Exec("PRAGMA synchronous=NORMAL;")
	db.Exec("PRAGMA foreign_keys=OFF;")

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS rules (
			id TEXT PRIMARY KEY,
			category TEXT,
			name TEXT,
			enabled BOOLEAN,
			type TEXT,
			scope TEXT,
			pattern TEXT,
			replacement TEXT,
			cel_expression TEXT,
			color TEXT,
			delay_ms INTEGER,
			visible BOOLEAN
		)
	`)
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS scope (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			enabled BOOLEAN,
			type TEXT,
			protocol TEXT,
			host TEXT,
			path TEXT
		)
	`)
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create settings table: %v", err)
	}

	// Insert default settings
	db.Exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('follow_proxy_rules', 'true')")

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS traffic (
			uid TEXT PRIMARY KEY,
			id INTEGER,
			method TEXT,
			host TEXT,
			path TEXT,
			query TEXT,
			status_code INTEGER,
			size INTEGER,
			request_size INTEGER,
			latency INTEGER,
			mime_type TEXT,
			tls BOOLEAN,
			protocol TEXT,
			lport INTEGER,
			rport INTEGER,
			source_ip TEXT,
			server_ip TEXT,
			has_cookie BOOLEAN,
			extension TEXT,
			source TEXT,
			title TEXT,
			tls_issuer TEXT,
			set_cookies INTEGER,
			request_raw TEXT,
			response_raw TEXT,
			time TEXT,
			length INTEGER,
			payload_request_size INTEGER,
			payload_response_size INTEGER,
			headers_size INTEGER,
			start_time TEXT,
			end_time TEXT,
			request_headers_size INTEGER,
			response_headers_size INTEGER,
			url_length INTEGER
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create traffic table: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS intercepts (
			uid TEXT PRIMARY KEY,
			id INTEGER,
			method TEXT,
			host TEXT,
			path TEXT,
			query TEXT,
			status_code INTEGER,
			size INTEGER,
			request_size INTEGER,
			latency INTEGER,
			mime_type TEXT,
			tls BOOLEAN,
			protocol TEXT,
			lport INTEGER,
			rport INTEGER,
			source_ip TEXT,
			server_ip TEXT,
			has_cookie BOOLEAN,
			extension TEXT,
			source TEXT,
			title TEXT,
			tls_issuer TEXT,
			set_cookies INTEGER,
			request_raw TEXT,
			response_raw TEXT,
			time TEXT,
			length INTEGER,
			payload_request_size INTEGER,
			payload_response_size INTEGER,
			headers_size INTEGER,
			start_time TEXT,
			end_time TEXT,
			request_headers_size INTEGER,
			response_headers_size INTEGER,
			url_length INTEGER
		)
	`)
	if err != nil {
		log.Fatalf("Failed to create intercepts table: %v", err)
	}

	// Add missing columns if they don't exist (migration)
	addColumn(db, "traffic", "length", "INTEGER")
	addColumn(db, "traffic", "payload_request_size", "INTEGER")
	addColumn(db, "traffic", "payload_response_size", "INTEGER")
	addColumn(db, "traffic", "headers_size", "INTEGER")
	addColumn(db, "traffic", "start_time", "TEXT")
	addColumn(db, "traffic", "end_time", "TEXT")
	addColumn(db, "traffic", "request_headers_size", "INTEGER")
	addColumn(db, "traffic", "response_headers_size", "INTEGER")
	addColumn(db, "traffic", "url_length", "INTEGER")

	addColumn(db, "intercepts", "request_headers_size", "INTEGER")
	addColumn(db, "intercepts", "response_headers_size", "INTEGER")
	addColumn(db, "intercepts", "url_length", "INTEGER")

	addColumn(db, "rules", "category", "TEXT")
	addColumn(db, "rules", "pattern", "TEXT")
	addColumn(db, "rules", "replacement", "TEXT")
	addColumn(db, "rules", "cel_expression", "TEXT")
	addColumn(db, "rules", "color", "TEXT")
	addColumn(db, "rules", "delay_ms", "INTEGER")
	addColumn(db, "rules", "visible", "BOOLEAN")

	// Determine starting ID based on last insert
	var maxID sql.NullInt64
	db.QueryRow("SELECT MAX(id) FROM traffic").Scan(&maxID)
	if maxID.Valid {
		globalID = int(maxID.Int64)
	}

	// Prepare the insert statement for optimization
	prepareStmt()

	// Clear old intercepts from previous sessions to prevent stale data
	db.Exec("DELETE FROM intercepts")

	// Inject default rules if table is empty
	var count int
	db.QueryRow("SELECT COUNT(*) FROM rules").Scan(&count)
	if count == 0 {
		defaultRules := []Rule{
			{ID: "default-ua", Category: "proxy", Name: "Meowl Identity", Enabled: true, Type: "replace", Scope: "request_header", Pattern: "User-Agent:.*", Replacement: "User-Agent: Meowl App/1.0", Visible: true},
			{ID: "delay-api", Category: "proxy", Name: "Throttled API (Demo)", Enabled: false, Type: "Delay", Scope: "url", Pattern: "/api/", DelayMs: 500, Visible: true},
			{ID: "intercept-sensitive", Category: "intercept", Name: "Intercept Auth", Enabled: true, Type: "MatchReplace", Scope: "url", Pattern: "login|auth|token", Visible: true},
			{ID: "hide-static", Category: "history", Name: "Hide Static Noise", Enabled: true, Type: "Hide", Scope: "all", Pattern: "\\.(png|jpg|gif|css|js|woff2?)(\\?.*)?$", Visible: true},
		}
		for _, r := range defaultRules {
			_, err = db.Exec(`
				INSERT INTO rules (id, category, name, enabled, type, scope, pattern, replacement, cel_expression, color, delay_ms, visible)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				r.ID, r.Category, r.Name, r.Enabled, r.Type, r.Scope, r.Pattern, r.Replacement, r.CelExpression, r.Color, r.DelayMs, r.Visible,
			)
			if err != nil {
				log.Printf("Failed to insert default rule %s: %v", r.ID, err)
			}
		}
	}

	log.Println("modernc.org/sqlite database initialized successfully with WAL mode")
}

func prepareStmt() {
	query := `
		INSERT INTO traffic (
			uid, id, method, host, path, query, status_code, size, request_size, 
			latency, mime_type, tls, protocol, lport, rport, source_ip, server_ip, 
			has_cookie, extension, source, title, tls_issuer, set_cookies, request_raw, response_raw, time,
			length, payload_request_size, payload_response_size, headers_size, start_time, end_time,
			request_headers_size, response_headers_size, url_length
		) VALUES (
			?, ?, ?, ?, ?, ?, ?, ?, ?, 
			?, ?, ?, ?, ?, ?, ?, ?, 
			?, ?, ?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?, ?
		)
	`
	var err error
	insertStmt, err = db.Prepare(query)
	if err != nil {
		log.Printf("Failed to prepare insert statement: %v", err)
	}

	interceptQuery := `
		INSERT OR REPLACE INTO intercepts (
			uid, id, method, host, path, query, status_code, size, request_size, 
			latency, mime_type, tls, protocol, lport, rport, source_ip, server_ip, 
			has_cookie, extension, source, title, tls_issuer, set_cookies, request_raw, response_raw, time,
			length, payload_request_size, payload_response_size, headers_size, start_time, end_time
		) VALUES (
			?, ?, ?, ?, ?, ?, ?, ?, ?, 
			?, ?, ?, ?, ?, ?, ?, ?, 
			?, ?, ?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?
		)
	`
	interceptStmt, err = db.Prepare(interceptQuery)
	if err != nil {
		log.Printf("Failed to prepare intercept statement: %v", err)
	}
}

func addColumn(db *sql.DB, table, col, colType string) {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var cid int
		var name, dataType string
		var notnull, pk int
		var dfltValue interface{}
		if err := rows.Scan(&cid, &name, &dataType, &notnull, &dfltValue, &pk); err == nil {
			if name == col {
				return
			}
		}
	}
	db.Exec("ALTER TABLE " + table + " ADD COLUMN " + col + " " + colType)
}

// InsertRequest inserts an event via purely prepared statements
func InsertRequest(t *TrafficEvent) {
	idMu.Lock()
	if t.ID == 0 {
		globalID++
		t.ID = globalID
	}
	idMu.Unlock()

	if t.Time == "" {
		t.Time = time.Now().Format("2006-01-02 15:04:05.000")
	}

	if insertStmt == nil {
		prepareStmt()
	}

	if insertStmt == nil {
		log.Println("Insert statement is nil, cannot insert")
		return
	}

	_, err := insertStmt.Exec(
		t.UID, t.ID, t.Method, t.Host, t.Path, t.Query, t.StatusCode, t.Size, t.RequestSize,
		t.Latency, t.MimeType, t.TLS, t.Protocol, t.LPort, t.RPort, t.SourceIP, t.ServerIP,
		t.HasCookie, t.Extension, t.Source, t.Title, t.TLSIssuer, t.SetCookies, t.RequestRaw, t.ResponseRaw, t.Time,
		t.Length, t.PayloadRequestSize, t.PayloadResponseSize, t.HeadersSize, t.StartTime, t.EndTime,
		t.RequestHeadersSize, t.ResponseHeadersSize, t.UrlLength,
	)

	if err != nil {
		log.Printf("Failed to insert request %s: %v", t.UID, err)
	}
}

// InsertIntercept saves a pending request to intercepts table
func InsertIntercept(t *TrafficEvent) {
	if interceptStmt == nil {
		prepareStmt()
	}
	if interceptStmt == nil {
		return
	}

	idMu.Lock()
	if t.ID == 0 {
		globalID++
		t.ID = globalID
	}
	idMu.Unlock()

	_, err := interceptStmt.Exec(
		t.UID, t.ID, t.Method, t.Host, t.Path, t.Query, t.StatusCode, t.Size, t.RequestSize,
		t.Latency, t.MimeType, t.TLS, t.Protocol, t.LPort, t.RPort, t.SourceIP, t.ServerIP,
		t.HasCookie, t.Extension, t.Source, t.Title, t.TLSIssuer, t.SetCookies, t.RequestRaw, t.ResponseRaw, t.Time,
		t.Length, t.PayloadRequestSize, t.PayloadResponseSize, t.HeadersSize, t.StartTime, t.EndTime,
		t.RequestHeadersSize, t.ResponseHeadersSize, t.UrlLength,
	)
	if err != nil {
		log.Printf("Failed to insert intercept %s: %v", t.UID, err)
	}
}

// MoveInterceptToHistory promotes an intercepted record to history. Returns true if record found and moved.
// UpdateInterceptResponse updates an existing intercept record with response data
func UpdateInterceptResponse(t *TrafficEvent) {
	_, err := db.Exec(`
		UPDATE intercepts 
		SET status_code = ?, response_raw = ?, end_time = ?, latency = ?, tls_issuer = ?
		WHERE uid = ?`,
		t.StatusCode, t.ResponseRaw, t.EndTime, t.Latency, t.TLSIssuer, t.UID)
	if err != nil {
		log.Printf("DB: Failed to update intercept response for %s: %v", t.UID, err)
	}
}

// UpdateInterceptWithResponse updates an existing intercept record with response data (convenience wrapper)
func UpdateInterceptWithResponse(uid string, statusCode int, responseRaw string, endTime string, latency int, tlsIssuer string) {
	_, err := db.Exec(`
		UPDATE intercepts 
		SET status_code = ?, response_raw = ?, end_time = ?, latency = ?, tls_issuer = ?
		WHERE uid = ?`,
		statusCode, responseRaw, endTime, latency, tlsIssuer, uid)
	if err != nil {
		log.Printf("DB: Failed to update intercept response for %s: %v", uid, err)
	}
}

// UpdateInterceptRequest updates an existing intercept record with edited request data
func UpdateInterceptRequest(uid string, requestRaw string, payloadSize int64, totalSize int64) {
	_, err := db.Exec(`
		UPDATE intercepts 
		SET request_raw = ?, payload_request_size = ?, request_size = ?
		WHERE uid = ?`,
		requestRaw, payloadSize, totalSize, uid)
	if err != nil {
		log.Printf("DB: Failed to update intercept request for %s: %v", uid, err)
	}
}

// MoveInterceptToHistory promotes an intercepted record to history. Returns true if record found and moved.
func MoveInterceptToHistory(uid string, statusCode int, responseRaw string, requestRaw string, endTime string, latency int, tlsIssuer string) bool {
	// First fetch the record from intercepts
	var t TrafficEvent
	err := db.QueryRow(`
		SELECT 
			uid, method, host, path, query, status_code, size, request_size, 
			latency, mime_type, tls, protocol, lport, rport, source_ip, server_ip, 
			has_cookie, extension, source, title, tls_issuer, set_cookies, request_raw, response_raw, time,
			length, payload_request_size, payload_response_size, headers_size, start_time, end_time,
			request_headers_size, response_headers_size, url_length
		FROM intercepts WHERE uid = ?`, uid).Scan(
		&t.UID, &t.Method, &t.Host, &t.Path, &t.Query, &t.StatusCode, &t.Size, &t.RequestSize,
		&t.Latency, &t.MimeType, &t.TLS, &t.Protocol, &t.LPort, &t.RPort, &t.SourceIP, &t.ServerIP,
		&t.HasCookie, &t.Extension, &t.Source, &t.Title, &t.TLSIssuer, &t.SetCookies, &t.RequestRaw, &t.ResponseRaw, &t.Time,
		&t.Length, &t.PayloadRequestSize, &t.PayloadResponseSize, &t.HeadersSize, &t.StartTime, &t.EndTime,
		&t.RequestHeadersSize, &t.ResponseHeadersSize, &t.UrlLength,
	)

	if err != nil {
		return false
	}

	// Update with final data
	t.StatusCode = statusCode
	t.ResponseRaw = responseRaw
	if requestRaw != "" {
		t.RequestRaw = requestRaw
	}
	t.EndTime = endTime
	t.Latency = latency
	if tlsIssuer != "" {
		t.TLSIssuer = tlsIssuer
	}

	// Insert into history
	InsertRequest(&t)

	// Delete from intercepts
	db.Exec("DELETE FROM intercepts WHERE uid = ?", uid)
	return true
}

func GetIntercepts() []TrafficEvent {
	rows, err := db.Query(`
		SELECT 
			uid, id, method, host, path, query, status_code, size, request_size, 
			latency, mime_type, tls, protocol, lport, rport, source_ip, server_ip, 
			has_cookie, extension, source, title, tls_issuer, set_cookies, request_raw, response_raw, time,
			COALESCE(length, 0), COALESCE(payload_request_size, 0), COALESCE(payload_response_size, 0), COALESCE(headers_size, 0),
			COALESCE(start_time, ''), COALESCE(end_time, ''),
			COALESCE(request_headers_size, 0), COALESCE(response_headers_size, 0), COALESCE(url_length, 0)
		FROM intercepts ORDER BY id DESC`)
	if err != nil {
		log.Printf("Query error on intercepts: %v", err)
		return []TrafficEvent{}
	}
	defer rows.Close()

	var results []TrafficEvent
	for rows.Next() {
		var t TrafficEvent
		err := rows.Scan(
			&t.UID, &t.ID, &t.Method, &t.Host, &t.Path, &t.Query, &t.StatusCode, &t.Size, &t.RequestSize,
			&t.Latency, &t.MimeType, &t.TLS, &t.Protocol, &t.LPort, &t.RPort, &t.SourceIP, &t.ServerIP,
			&t.HasCookie, &t.Extension, &t.Source, &t.Title, &t.TLSIssuer, &t.SetCookies, &t.RequestRaw, &t.ResponseRaw, &t.Time,
			&t.Length, &t.PayloadRequestSize, &t.PayloadResponseSize, &t.HeadersSize,
			&t.StartTime, &t.EndTime,
			&t.RequestHeadersSize, &t.ResponseHeadersSize, &t.UrlLength,
		)
		if err != nil {
			log.Printf("Scan error on intercepts: %v", err)
			continue
		}
		results = append(results, t)
	}
	return results
}

// DeleteIntercept removes an intercepted record from the database
func DeleteIntercept(uid string) {
	_, err := db.Exec("DELETE FROM intercepts WHERE uid = ?", uid)
	if err != nil {
		log.Printf("DB: Failed to delete intercept %s: %v", uid, err)
	}
}

// GetHistory returns a copy of all traffic events
func GetHistory() []TrafficEvent {
	rows, err := db.Query(`
		SELECT 
			uid, id, method, host, path, query, status_code, size, request_size, 
			latency, mime_type, tls, protocol, lport, rport, source_ip, server_ip, 
			has_cookie, extension, source, title, tls_issuer, set_cookies, request_raw, response_raw, time,
			COALESCE(length, 0), COALESCE(payload_request_size, 0), COALESCE(payload_response_size, 0), COALESCE(headers_size, 0),
			COALESCE(start_time, ''), COALESCE(end_time, ''),
			COALESCE(request_headers_size, 0), COALESCE(response_headers_size, 0), COALESCE(url_length, 0)
		FROM traffic ORDER BY id DESC LIMIT 10000
	`)
	if err != nil {
		log.Printf("Query error: %v", err)
		return []TrafficEvent{}
	}
	defer rows.Close()

	var results []TrafficEvent
	for rows.Next() {
		var t TrafficEvent
		err := rows.Scan(
			&t.UID, &t.ID, &t.Method, &t.Host, &t.Path, &t.Query, &t.StatusCode, &t.Size, &t.RequestSize,
			&t.Latency, &t.MimeType, &t.TLS, &t.Protocol, &t.LPort, &t.RPort, &t.SourceIP, &t.ServerIP,
			&t.HasCookie, &t.Extension, &t.Source, &t.Title, &t.TLSIssuer, &t.SetCookies, &t.RequestRaw, &t.ResponseRaw, &t.Time,
			&t.Length, &t.PayloadRequestSize, &t.PayloadResponseSize, &t.HeadersSize,
			&t.StartTime, &t.EndTime,
			&t.RequestHeadersSize, &t.ResponseHeadersSize, &t.UrlLength,
		)
		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}
		results = append(results, t)
	}
	return results
}

// ClearHistory deletes all records and resets ID counter
func ClearHistory() {
	idMu.Lock()
	defer idMu.Unlock()
	globalID = 0
	_, err := db.Exec("DELETE FROM traffic")
	if err != nil {
		log.Printf("Failed to clear DB: %v", err)
	}
}

// DeleteRequests removes specific records by UIDs
func DeleteRequests(uids []string) {
	if len(uids) == 0 {
		return
	}

	// Prepare placeholders for the IN clause
	placeholders := ""
	args := make([]interface{}, len(uids))
	for i, uid := range uids {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args[i] = uid
	}

	query := "DELETE FROM traffic WHERE uid IN (" + placeholders + ")"
	_, err := db.Exec(query, args...)
	if err != nil {
		log.Printf("Failed to delete requests: %v", err)
	}
}

// --- Rules Management ---

type Rule struct {
	ID            string `json:"id"`
	Category      string `json:"category"`
	Name          string `json:"name"`
	Enabled       bool   `json:"enabled"`
	Type          string `json:"type"`
	Scope         string `json:"scope"`
	Pattern       string `json:"pattern"`
	Replacement   string `json:"replacement"`
	CelExpression string `json:"cel_expression"`
	Color         string `json:"color"`
	DelayMs       int    `json:"delay_ms"`
	Visible       bool   `json:"visible"`
}

func GetRules() []Rule {
	rulesMu.Lock()
	defer rulesMu.Unlock()

	rows, err := db.Query("SELECT id, coalesce(category, 'proxy'), name, enabled, coalesce(type, 'replace'), scope, coalesce(pattern, ''), coalesce(replacement, ''), coalesce(cel_expression, ''), coalesce(color, ''), coalesce(delay_ms, 0), coalesce(visible, 1) FROM rules")
	if err != nil {
		log.Printf("Error querying rules: %v", err)
		return []Rule{}
	}
	defer rows.Close()

	var rules []Rule
	for rows.Next() {
		var r Rule
		err := rows.Scan(&r.ID, &r.Category, &r.Name, &r.Enabled, &r.Type, &r.Scope, &r.Pattern, &r.Replacement, &r.CelExpression, &r.Color, &r.DelayMs, &r.Visible)
		if err != nil {
			log.Printf("Error scanning rule: %v", err)
			continue
		}
		rules = append(rules, r)
	}
	return rules
}

func SaveRules(rules []Rule) error {
	rulesMu.Lock()
	defer rulesMu.Unlock()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM rules")
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT INTO rules (id, category, name, enabled, type, scope, pattern, replacement, cel_expression, color, delay_ms, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range rules {
		_, err = stmt.Exec(r.ID, r.Category, r.Name, r.Enabled, r.Type, r.Scope, r.Pattern, r.Replacement, r.CelExpression, r.Color, r.DelayMs, r.Visible)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

type ScopeRule struct {
	ID       int    `json:"id"`
	Enabled  bool   `json:"enabled"`
	Type     string `json:"type"` // include, exclude
	Protocol string `json:"protocol"`
	Host     string `json:"host"`
	Path     string `json:"path"`
}

func GetScopeRules() []ScopeRule {
	rulesMu.Lock()
	defer rulesMu.Unlock()

	rows, err := db.Query("SELECT id, enabled, type, protocol, host, path FROM scope")
	if err != nil {
		log.Printf("Error querying scope: %v", err)
		return []ScopeRule{}
	}
	defer rows.Close()

	var rules []ScopeRule
	for rows.Next() {
		var r ScopeRule
		err := rows.Scan(&r.ID, &r.Enabled, &r.Type, &r.Protocol, &r.Host, &r.Path)
		if err != nil {
			log.Printf("Error scanning scope rule: %v", err)
			continue
		}
		rules = append(rules, r)
	}

	if len(rules) == 0 {
		return []ScopeRule{{ID: 1, Enabled: true, Type: "include", Protocol: "Any", Host: ".*", Path: ".*"}}
	}
	return rules
}

func SaveScopeRules(rules []ScopeRule) error {
	rulesMu.Lock()
	defer rulesMu.Unlock()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM scope")
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT INTO scope (id, enabled, type, protocol, host, path) VALUES (?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range rules {
		_, err = stmt.Exec(r.ID, r.Enabled, r.Type, r.Protocol, r.Host, r.Path)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetSetting retrieves a setting value by key
func GetSetting(key string, defaultValue string) string {
	var val string
	err := db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&val)
	if err != nil {
		return defaultValue
	}
	return val
}

// SetSetting saves or updates a setting value
func SetSetting(key string, value string) error {
	_, err := db.Exec("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, value)
	return err
}
