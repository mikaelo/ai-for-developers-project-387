### Hexlet tests and linter status:
[![Actions Status](https://github.com/mikaelo/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/mikaelo/ai-for-developers-project-386/actions)

## Development

Compile the TypeSpec contract:

```bash
npm run compile
```

Start the backend API:

```bash
npm run backend:run
```

Start the frontend in a separate terminal:

```bash
npm run frontend:dev
```

The frontend uses `VITE_API_BASE_URL` and defaults to `http://127.0.0.1:5080`.

Run backend tests:

```bash
npm run backend:test
```

Run the end-to-end booking scenario with Playwright:

```bash
npm run integration:test
```

The integration scenario starts the real backend and frontend, books an `Intro call`
as a guest, verifies that a repeated booking for the same slot returns `409`, and
checks that the owner sees the booking in `/admin/bookings`.

Prism mock API is still available for contract-only frontend work:

```bash
npm run compile
npm run mock
```

## Docker

Build the production image:

```bash
docker build -t call-calendar .
```

Run the container. The application listens on the port from `PORT`:

```bash
docker run --rm -e PORT=8080 -p 8080:8080 call-calendar
```

Open `http://127.0.0.1:8080`.

The production UI is served from `/booking`, and API endpoints are served under `/api`.
For example, `GET /api/event-types` returns public event types as JSON.

## Production

Production URL: pending deployment
