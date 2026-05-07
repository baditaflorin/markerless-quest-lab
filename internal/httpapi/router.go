package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/baditaflorin/markerless-quest-lab/internal/challenge"
	"github.com/baditaflorin/markerless-quest-lab/internal/config"
	"github.com/baditaflorin/markerless-quest-lab/internal/telemetry"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type Dependencies struct {
	Config     config.Config
	Challenges *challenge.Service
	Metrics    *telemetry.Metrics
	Logger     zerolog.Logger
}

type Router struct {
	cfg        config.Config
	challenges *challenge.Service
	metrics    *telemetry.Metrics
	logger     zerolog.Logger
	startedAt  time.Time
}

func NewRouter(deps Dependencies) http.Handler {
	api := Router{
		cfg:        deps.Config,
		challenges: deps.Challenges,
		metrics:    deps.Metrics,
		logger:     deps.Logger,
		startedAt:  time.Now().UTC(),
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(api.metricsMiddleware)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			deps.Config.PublicBaseURL,
		},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
		MaxAge:         300,
	}))

	r.Get("/healthz", api.health)
	r.Get("/readyz", api.ready)
	r.Get("/metrics", api.metrics.Handler().ServeHTTP)

	r.Route("/api", func(r chi.Router) {
		r.Get("/challenges", api.listChallenges)
		r.Get("/challenges/{challengeID}", api.getChallenge)
		r.Post("/challenges/{challengeID}/events", api.recordChallengeEvent)
		r.Post("/sessions", api.createSession)
	})

	return r
}

func (api Router) metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)

		route := chi.RouteContext(r.Context()).RoutePattern()
		if route == "" {
			route = "unmatched"
		}
		api.metrics.ObserveHTTP(r.Method, route, ww.Status(), time.Since(started))
	})
}

func (api Router) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (api Router) ready(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":         "ready",
		"challengeCount": len(api.challenges.List()),
		"startedAt":      api.startedAt,
		"publicBaseURL":  api.cfg.PublicBaseURL,
	})
}

func (api Router) listChallenges(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"challenges": api.challenges.List()})
}

func (api Router) getChallenge(w http.ResponseWriter, r *http.Request) {
	item, ok := api.challenges.Get(chi.URLParam(r, "challengeID"))
	if !ok {
		writeError(w, http.StatusNotFound, "challenge_not_found", "Challenge does not exist.")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (api Router) createSession(w http.ResponseWriter, r *http.Request) {
	sessionID := uuid.NewString()
	api.metrics.SessionsTotal.Inc()
	api.metrics.ActiveSessions.Inc()
	writeJSON(w, http.StatusCreated, map[string]any{
		"sessionId": sessionID,
		"createdAt": time.Now().UTC(),
	})
}

func (api Router) recordChallengeEvent(w http.ResponseWriter, r *http.Request) {
	challengeID := chi.URLParam(r, "challengeID")
	var event challenge.Event
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&event); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", "Request body must be valid JSON.")
		return
	}
	event.ChallengeID = challengeID
	if event.EventType == "" {
		event.EventType = "progress"
	}

	progress, err := api.challenges.RecordEvent(r.Context(), event)
	if err != nil {
		switch {
		case errors.Is(err, challenge.ErrChallengeNotFound):
			writeError(w, http.StatusNotFound, "challenge_not_found", "Challenge does not exist.")
		case errors.Is(err, challenge.ErrInvalidEvent):
			writeError(w, http.StatusBadRequest, "invalid_event", err.Error())
		default:
			api.logger.Error().Err(err).Msg("record challenge event")
			writeError(w, http.StatusInternalServerError, "internal_error", "Could not record challenge event.")
		}
		return
	}

	api.metrics.ObserveChallengeEvent(progress.ChallengeID, event.EventType, progress.Completed)
	for _, unlock := range progress.Unlocks {
		api.metrics.ObserveUnlock(progress.ChallengeID, unlock.ID)
	}
	writeJSON(w, http.StatusAccepted, progress)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{
		"code":    strings.TrimSpace(code),
		"message": strings.TrimSpace(message),
	})
}
