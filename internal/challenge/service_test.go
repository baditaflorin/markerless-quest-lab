package challenge

import (
	"context"
	"errors"
	"testing"
)

func TestRecordEventCompletesChallenge(t *testing.T) {
	service := NewService(DefaultCatalog())

	progress, err := service.RecordEvent(context.Background(), Event{
		SessionID:       "session-1",
		ChallengeID:     "mirror-squat",
		EventType:       "completion",
		Score:           0.88,
		Visibility:      0.82,
		Reps:            5,
		DurationSeconds: 20,
	})
	if err != nil {
		t.Fatalf("record event: %v", err)
	}
	if !progress.Completed {
		t.Fatalf("expected challenge to complete")
	}
	if len(progress.Unlocks) != 1 || progress.Unlocks[0].ID != "avatar-wireframe" {
		t.Fatalf("unexpected unlocks: %+v", progress.Unlocks)
	}
}

func TestRecordEventRejectsInvalidScore(t *testing.T) {
	service := NewService(DefaultCatalog())

	_, err := service.RecordEvent(context.Background(), Event{
		SessionID:   "session-1",
		ChallengeID: "mirror-squat",
		EventType:   "progress",
		Score:       1.1,
		Visibility:  0.5,
	})
	if !errors.Is(err, ErrInvalidEvent) {
		t.Fatalf("expected ErrInvalidEvent, got %v", err)
	}
}

func TestCompletedProgressIsSticky(t *testing.T) {
	service := NewService(DefaultCatalog())

	_, err := service.RecordEvent(context.Background(), Event{
		SessionID:       "session-1",
		ChallengeID:     "calibrate-frame",
		EventType:       "completion",
		Score:           0.9,
		Visibility:      0.9,
		DurationSeconds: 9,
	})
	if err != nil {
		t.Fatalf("record completion: %v", err)
	}

	progress, err := service.RecordEvent(context.Background(), Event{
		SessionID:   "session-1",
		ChallengeID: "calibrate-frame",
		EventType:   "progress",
		Score:       0.2,
		Visibility:  0.2,
	})
	if err != nil {
		t.Fatalf("record regression: %v", err)
	}
	if !progress.Completed {
		t.Fatalf("completed challenge should remain completed")
	}
}
