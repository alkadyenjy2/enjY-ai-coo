# JARVIS container deployment fallback

This is a provider-neutral fallback for the existing Express + Vite server. It does not replace the canonical Vercel project, change DNS, or authorize a production cutover. Keep Vercel as-is until an alternative has passed the checks below.

## Build and run locally

Requirements: Docker with BuildKit enabled.

```sh
docker build -t jarvis-coo:local .
docker run --rm -p 3000:3000 --env-file .env jarvis-coo:local
```

Use a local, untracked `.env` file only for development. Never commit it or bake secrets into the image.

## Host requirements

Choose a Docker-compatible host that supports:
- a long-running Node.js HTTP process and inbound HTTPS;
- configurable secret/environment variables;
- outbound HTTPS to the configured providers and persistence service;
- restart-on-failure and application logs;
- a documented price/quota model that the owner has reviewed.

Set the container port to `3000` or set `PORT` to the port supplied by the host. The start command is `npm start`; production mode and the live-dependency readiness gate are enabled by that script.

Configure the existing provider and persistence credentials through the host's secret manager. Do not paste credentials into GitHub, pull requests, issue comments, chat, or deployment logs. Do not enable billable provider routes or add paid services as part of this fallback.

## Verify before any production cutover

1. Confirm the image builds from the target commit.
2. Deploy to a private/staging URL first; do not change the production domain.
3. Check `GET /api/health` for basic process health.
4. Check `GET /api/readiness` (also `/api/ready` and `/api/healthz`). A production candidate must return HTTP 200 with `status: "ready"`; HTTP 503 means a required live dependency is not ready.
5. Verify authentication is enforced on protected routes (an unauthenticated `/api/auth/me` should not become public).
6. Verify operational history persists through a restart using the configured durable store; the process-local in-memory list alone is not durable.
7. Exercise a real provider only after the owner has securely configured an approved route and any cost implications are understood.
8. Review logs for accidental secrets and confirm the host's sleep, usage, retention, region, and billing terms.

## Cutover gate

Do not point a production domain, disable the existing deployment, enable outbound actions, or mark JARVIS production-ready until staging passes the checks above and the owner has reviewed the target host's cost and operational limits. If any gate fails, leave the existing deployment untouched and report the exact failure.
