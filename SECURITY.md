# Security

## Data Handling

Markerless Quest Lab processes webcam frames in the browser. The API should receive only challenge events, scores, visibility summaries, and session IDs.

The GitHub Pages demo is browser-only and does not send challenge progress to the Go API.

Do not commit or upload:

- `.env` files or production configuration.
- Private keys, certificates, tokens, or package credentials.
- Camera recordings, screenshots, biometric exports, or user identity data.

## Local Safeguards

Run these before publishing:

```bash
./scripts/check-secrets.sh
./scripts/check.sh
./scripts/smoke.sh
```

Install local hooks with:

```bash
./scripts/install-hooks.sh
```

## Reporting

For now, open a private security issue or contact the repository owner directly before publishing exploit details.
