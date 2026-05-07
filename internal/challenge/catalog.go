package challenge

func DefaultCatalog() []Challenge {
	return []Challenge{
		{
			ID:                "calibrate-frame",
			Title:             "Frame Calibration",
			Category:          "calibration",
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
	}
}
