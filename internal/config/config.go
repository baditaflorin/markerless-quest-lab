package config

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	AppEnv        string `env:"APP_ENV" envDefault:"development"`
	HTTPAddr      string `env:"HTTP_ADDR" envDefault:":8080"`
	PublicBaseURL string `env:"PUBLIC_BASE_URL" envDefault:"http://localhost:25342"`
	LogLevel      string `env:"LOG_LEVEL" envDefault:"info"`
}

func Load() (Config, error) {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return Config{}, err
	}
	if strings.TrimSpace(cfg.HTTPAddr) == "" {
		return Config{}, fmt.Errorf("HTTP_ADDR cannot be empty")
	}
	if _, err := url.ParseRequestURI(cfg.PublicBaseURL); err != nil {
		return Config{}, fmt.Errorf("PUBLIC_BASE_URL must be an absolute URL: %w", err)
	}
	return cfg, nil
}
