package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/baditaflorin/markerless-quest-lab/internal/challenge"
	"github.com/baditaflorin/markerless-quest-lab/internal/config"
	"github.com/baditaflorin/markerless-quest-lab/internal/telemetry"
	"github.com/rs/zerolog"
)

func testRouter() http.Handler {
	return NewRouter(Dependencies{
		Config: config.Config{
			AppEnv:        "test",
			HTTPAddr:      ":0",
			PublicBaseURL: "http://localhost:25342",
			LogLevel:      "disabled",
		},
		Challenges: challenge.NewService(challenge.DefaultCatalog()),
		Metrics:    telemetry.New(),
		Logger:     zerolog.Nop(),
	})
}

func TestHealthAndChallengeList(t *testing.T) {
	router := testRouter()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("health status = %d", res.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/challenges", nil)
	res = httptest.NewRecorder()
	router.ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("list status = %d", res.Code)
	}
	if !strings.Contains(res.Body.String(), "mirror-squat") {
		t.Fatalf("expected catalog in response, got %s", res.Body.String())
	}
}

func TestCreateSessionAndCompleteChallenge(t *testing.T) {
	router := testRouter()

	req := httptest.NewRequest(http.MethodPost, "/api/sessions", nil)
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)
	if res.Code != http.StatusCreated {
		t.Fatalf("session status = %d", res.Code)
	}

	var session struct {
		SessionID string `json:"sessionId"`
	}
	if err := json.NewDecoder(res.Body).Decode(&session); err != nil {
		t.Fatalf("decode session: %v", err)
	}
	if session.SessionID == "" {
		t.Fatalf("session id should be set")
	}

	body := []byte(`{"sessionId":"` + session.SessionID + `","eventType":"completion","score":0.91,"visibility":0.9,"durationSeconds":9}`)
	req = httptest.NewRequest(http.MethodPost, "/api/challenges/calibrate-frame/events", bytes.NewReader(body))
	res = httptest.NewRecorder()
	router.ServeHTTP(res, req)
	if res.Code != http.StatusAccepted {
		t.Fatalf("event status = %d body=%s", res.Code, res.Body.String())
	}
	if !strings.Contains(res.Body.String(), `"completed":true`) {
		t.Fatalf("expected completion progress, got %s", res.Body.String())
	}
}

func TestMetricsEndpointIncludesCustomMetrics(t *testing.T) {
	router := testRouter()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)

	req = httptest.NewRequest(http.MethodGet, "/metrics", nil)
	res = httptest.NewRecorder()
	router.ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("metrics status = %d", res.Code)
	}
	if !strings.Contains(res.Body.String(), "markerless_http_requests_total") {
		t.Fatalf("expected custom metric, got %s", res.Body.String())
	}
}
