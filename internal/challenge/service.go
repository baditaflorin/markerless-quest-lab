package challenge

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"
	"time"
)

var (
	ErrChallengeNotFound = errors.New("challenge not found")
	ErrInvalidEvent      = errors.New("invalid challenge event")
)

type Unlock struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Kind  string `json:"kind"`
}

type Challenge struct {
	ID                string   `json:"id"`
	Title             string   `json:"title"`
	Category          string   `json:"category"`
	Mechanic          string   `json:"mechanic"`
	Description       string   `json:"description"`
	TargetSeconds     int      `json:"targetSeconds,omitempty"`
	TargetReps        int      `json:"targetReps,omitempty"`
	MinimumScore      float64  `json:"minimumScore"`
	MinimumVisibility float64  `json:"minimumVisibility"`
	Cues              []string `json:"cues"`
	Unlocks           []Unlock `json:"unlocks"`
}

type Event struct {
	SessionID       string    `json:"sessionId"`
	ChallengeID     string    `json:"challengeId"`
	EventType       string    `json:"eventType"`
	Score           float64   `json:"score"`
	Visibility      float64   `json:"visibility"`
	Reps            int       `json:"reps,omitempty"`
	DurationSeconds int       `json:"durationSeconds,omitempty"`
	ClientTimestamp time.Time `json:"clientTimestamp,omitempty"`
}

type Progress struct {
	SessionID   string    `json:"sessionId"`
	ChallengeID string    `json:"challengeId"`
	Completed   bool      `json:"completed"`
	Score       float64   `json:"score"`
	Visibility  float64   `json:"visibility"`
	Message     string    `json:"message"`
	Unlocks     []Unlock  `json:"unlocks"`
	RecordedAt  time.Time `json:"recordedAt"`
}

type Service struct {
	catalog    []Challenge
	progressMu sync.RWMutex
	progress   map[string]map[string]Progress
}

func NewService(catalog []Challenge) *Service {
	catalogCopy := slices.Clone(catalog)
	return &Service{
		catalog:  catalogCopy,
		progress: make(map[string]map[string]Progress),
	}
}

func (s *Service) List() []Challenge {
	return slices.Clone(s.catalog)
}

func (s *Service) Get(id string) (Challenge, bool) {
	for _, item := range s.catalog {
		if item.ID == id {
			return item, true
		}
	}
	return Challenge{}, false
}

func (s *Service) RecordEvent(_ context.Context, event Event) (Progress, error) {
	event.ChallengeID = strings.TrimSpace(event.ChallengeID)
	event.SessionID = strings.TrimSpace(event.SessionID)
	event.EventType = strings.TrimSpace(event.EventType)

	if event.SessionID == "" || event.ChallengeID == "" || event.EventType == "" {
		return Progress{}, fmt.Errorf("%w: sessionId, challengeId, and eventType are required", ErrInvalidEvent)
	}
	if event.Score < 0 || event.Score > 1 {
		return Progress{}, fmt.Errorf("%w: score must be between 0 and 1", ErrInvalidEvent)
	}
	if event.Visibility < 0 || event.Visibility > 1 {
		return Progress{}, fmt.Errorf("%w: visibility must be between 0 and 1", ErrInvalidEvent)
	}

	item, ok := s.Get(event.ChallengeID)
	if !ok {
		return Progress{}, ErrChallengeNotFound
	}

	completed := event.Score >= item.MinimumScore && event.Visibility >= item.MinimumVisibility
	if item.TargetSeconds > 0 {
		completed = completed && event.DurationSeconds >= item.TargetSeconds
	}
	if item.TargetReps > 0 {
		completed = completed && event.Reps >= item.TargetReps
	}

	progress := Progress{
		SessionID:   event.SessionID,
		ChallengeID: event.ChallengeID,
		Completed:   completed,
		Score:       event.Score,
		Visibility:  event.Visibility,
		Message:     progressMessage(completed, item),
		Unlocks:     []Unlock{},
		RecordedAt:  time.Now().UTC(),
	}
	if completed {
		progress.Unlocks = slices.Clone(item.Unlocks)
	}

	s.progressMu.Lock()
	defer s.progressMu.Unlock()
	if _, ok := s.progress[event.SessionID]; !ok {
		s.progress[event.SessionID] = make(map[string]Progress)
	}
	previous := s.progress[event.SessionID][event.ChallengeID]
	if previous.Completed && !progress.Completed {
		progress.Completed = true
		progress.Unlocks = previous.Unlocks
		progress.Message = "Already unlocked. Keep refining the movement quality."
	}
	s.progress[event.SessionID][event.ChallengeID] = progress

	return progress, nil
}

func progressMessage(completed bool, item Challenge) string {
	if completed {
		return "Sidequest complete. Unlock added to this session."
	}
	if item.TargetReps > 0 {
		return "Keep collecting clean reps with visible knees, hips, and shoulders."
	}
	return "Hold the pose a little longer with stronger landmark visibility."
}
