package backend

// TrafficEvent represents a single intercepted HTTP/HTTPS request and its response.
type TrafficEvent struct {
	UID                 string `json:"_uid" db:"uid"`
	ID                  int    `json:"id" db:"id"`
	Method              string `json:"method" db:"method"`
	Host                string `json:"host" db:"host"`
	Path                string `json:"path" db:"path"`
	Query               string `json:"query" db:"query"`
	StatusCode          int    `json:"status_code" db:"status_code"`
	MimeType            string `json:"mime_type" db:"mime_type"`
	Size                int64  `json:"size" db:"size"`
	RequestSize         int64  `json:"request_size" db:"request_size"`
	Protocol            string `json:"protocol" db:"protocol"`
	TLS                 bool   `json:"tls" db:"tls"`
	TLSIssuer           string `json:"tls_issuer" db:"tls_issuer"`
	ServerIP            string `json:"server_ip" db:"server_ip"`
	SourceIP            string `json:"source_ip" db:"source_ip"`
	LPort               int    `json:"lport" db:"lport"`
	RPort               int    `json:"rport" db:"rport"`
	RequestRaw          string `json:"request_raw" db:"request_raw"`
	ResponseRaw         string `json:"response_raw" db:"response_raw"`
	Extension           string `json:"extension" db:"extension"`
	Title               string `json:"title" db:"title"`
	Latency             int    `json:"latency" db:"latency"`
	HasCookie           bool   `json:"has_cookie" db:"has_cookie"`
	SetCookies          int    `json:"set_cookies" db:"set_cookies"`
	Source              string `json:"source" db:"source"`
	Time                string `json:"time" db:"time"`
	Length              int64  `json:"length" db:"length"`
	PayloadRequestSize  int64  `json:"payload_request_size" db:"payload_request_size"`
	PayloadResponseSize int64  `json:"payload_response_size" db:"payload_response_size"`
	HeadersSize         int64  `json:"headers_size" db:"headers_size"`
	StartTime           string `json:"start_time" db:"start_time"`
	EndTime             string `json:"end_time" db:"end_time"`
	RequestHeadersSize  int64  `json:"request_headers_size" db:"request_headers_size"`
	ResponseHeadersSize int64  `json:"response_headers_size" db:"response_headers_size"`
	UrlLength           int64  `json:"url_length" db:"url_length"`
}

// WSMessage is the envelope for broadcast messages
type WSMessage struct {
	Type       string      `json:"type"`
	Data       interface{} `json:"data,omitempty"`
	BinaryData []byte      `json:"-"` // Used for Protobuf binary broadcasts
}
