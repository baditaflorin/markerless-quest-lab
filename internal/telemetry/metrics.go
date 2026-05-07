package telemetry

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Metrics struct {
	Registry              *prometheus.Registry
	HTTPRequestTotal      *prometheus.CounterVec
	HTTPRequestDuration   *prometheus.HistogramVec
	ChallengeEventsTotal  *prometheus.CounterVec
	ChallengeUnlocksTotal *prometheus.CounterVec
	SessionsTotal         prometheus.Counter
	ActiveSessions        prometheus.Gauge
}

func New() *Metrics {
	registry := prometheus.NewRegistry()
	metrics := &Metrics{
		Registry: registry,
		HTTPRequestTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "markerless_http_requests_total",
				Help: "Total API HTTP requests.",
			},
			[]string{"method", "route", "status"},
		),
		HTTPRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "markerless_http_request_duration_seconds",
				Help:    "API HTTP request duration in seconds.",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"method", "route", "status"},
		),
		ChallengeEventsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "markerless_challenge_events_total",
				Help: "Challenge events submitted by clients.",
			},
			[]string{"challenge_id", "event_type", "completed"},
		),
		ChallengeUnlocksTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "markerless_challenge_unlocks_total",
				Help: "Challenge unlocks awarded by the API.",
			},
			[]string{"challenge_id", "unlock_id"},
		),
		SessionsTotal: prometheus.NewCounter(
			prometheus.CounterOpts{
				Name: "markerless_sessions_total",
				Help: "Capture sessions created by clients.",
			},
		),
		ActiveSessions: prometheus.NewGauge(
			prometheus.GaugeOpts{
				Name: "markerless_active_sessions",
				Help: "Capture sessions seen since process start.",
			},
		),
	}
	registry.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
		metrics.HTTPRequestTotal,
		metrics.HTTPRequestDuration,
		metrics.ChallengeEventsTotal,
		metrics.ChallengeUnlocksTotal,
		metrics.SessionsTotal,
		metrics.ActiveSessions,
	)
	return metrics
}

func (m *Metrics) Handler() http.Handler {
	return promhttp.HandlerFor(m.Registry, promhttp.HandlerOpts{Registry: m.Registry})
}

func (m *Metrics) ObserveHTTP(method, route string, status int, duration time.Duration) {
	statusLabel := strconv.Itoa(status)
	m.HTTPRequestTotal.WithLabelValues(method, route, statusLabel).Inc()
	m.HTTPRequestDuration.WithLabelValues(method, route, statusLabel).Observe(duration.Seconds())
}

func (m *Metrics) ObserveChallengeEvent(challengeID, eventType string, completed bool) {
	m.ChallengeEventsTotal.WithLabelValues(challengeID, eventType, strconv.FormatBool(completed)).Inc()
}

func (m *Metrics) ObserveUnlock(challengeID, unlockID string) {
	m.ChallengeUnlocksTotal.WithLabelValues(challengeID, unlockID).Inc()
}
