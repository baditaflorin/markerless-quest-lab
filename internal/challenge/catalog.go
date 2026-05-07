package challenge

func DefaultCatalog() []Challenge {
	return []Challenge{
		{
			ID:                "calibrate-frame",
			Title:             "Frame Calibration",
			Category:          "calibration",
			Mechanic:          "hold-visible",
			Description:       "Stand in frame until landmarks are stable and visible.",
			TargetSeconds:     8,
			MinimumScore:      0.72,
			MinimumVisibility: 0.68,
			Cues: []string{
				"Keep head, shoulders, hips, knees, and ankles visible.",
				"Step back until the full body outline is inside the capture lane.",
			},
			Unlocks: []Unlock{
				{ID: "trail-overlay", Label: "Motion trail overlay", Kind: "visual"},
			},
		},
		{
			ID:                "mirror-squat",
			Title:             "Mirror Squat",
			Category:          "movement",
			Mechanic:          "squat-reps",
			Description:       "Complete controlled squats while keeping both knees tracked.",
			TargetReps:        5,
			MinimumScore:      0.76,
			MinimumVisibility: 0.64,
			Cues: []string{
				"Keep feet planted and knees visible.",
				"Move slowly enough for the tracker to follow the full range.",
			},
			Unlocks: []Unlock{
				{ID: "avatar-wireframe", Label: "Wireframe avatar", Kind: "avatar"},
			},
		},
		{
			ID:                "balance-beacon",
			Title:             "Balance Beacon",
			Category:          "control",
			Mechanic:          "balance-hold",
			Description:       "Hold a centered pose with low jitter for the target time.",
			TargetSeconds:     12,
			MinimumScore:      0.82,
			MinimumVisibility: 0.70,
			Cues: []string{
				"Center your hips over the guide line.",
				"Keep shoulders level and breathe normally.",
			},
			Unlocks: []Unlock{
				{ID: "precision-export", Label: "Precision export preview", Kind: "export"},
			},
		},
		{
			ID:                "overhead-signal",
			Title:             "Overhead Signal",
			Category:          "gesture",
			Mechanic:          "hands-up-hold",
			Description:       "Raise both hands above your head and hold the signal cleanly.",
			TargetSeconds:     5,
			MinimumScore:      0.74,
			MinimumVisibility: 0.62,
			Cues: []string{
				"Lift both wrists above your nose line.",
				"Keep shoulders visible so the gesture can be confirmed.",
			},
			Unlocks: []Unlock{
				{ID: "signal-burst", Label: "Signal burst effect", Kind: "visual"},
			},
		},
		{
			ID:                "side-step-spark",
			Title:             "Side Step Spark",
			Category:          "agility",
			Mechanic:          "side-steps",
			Description:       "Shift left and right across the capture lane to charge the spark meter.",
			TargetReps:        4,
			MinimumScore:      0.70,
			MinimumVisibility: 0.60,
			Cues: []string{
				"Move your hips clearly left and right from center.",
				"Keep the full body visible while changing sides.",
			},
			Unlocks: []Unlock{
				{ID: "lane-sparks", Label: "Lane spark overlay", Kind: "visual"},
			},
		},
	}
}
