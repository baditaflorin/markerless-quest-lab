package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/baditaflorin/markerless-quest-lab/internal/challenge"
	"github.com/baditaflorin/markerless-quest-lab/internal/config"
	"github.com/baditaflorin/markerless-quest-lab/internal/httpapi"
	"github.com/baditaflorin/markerless-quest-lab/internal/telemetry"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("load config")
	}

	level, err := zerolog.ParseLevel(cfg.LogLevel)
	if err != nil {
		log.Fatal().Err(err).Str("log_level", cfg.LogLevel).Msg("parse log level")
	}
	zerolog.SetGlobalLevel(level)
	log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()

	metrics := telemetry.New()
	challenges := challenge.NewService(challenge.DefaultCatalog())
	router := httpapi.NewRouter(httpapi.Dependencies{
		Config:     cfg,
		Challenges: challenges,
		Metrics:    metrics,
		Logger:     log.Logger,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Info().Str("addr", cfg.HTTPAddr).Str("env", cfg.AppEnv).Msg("api listening")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal().Err(err).Msg("api stopped unexpectedly")
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("graceful shutdown failed")
		os.Exit(1)
	}
	log.Info().Msg("api stopped")
}
