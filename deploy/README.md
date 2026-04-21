# Public Beta Deployment Guide

This folder documents how to deploy the AI Itinerary Optimizer backend for an
external (public) beta. It is the concrete implementation of Phase 1 of the
"Public beta rollout" plan.

The target topology is a single VPS instance running Docker. Scaling out is
intentionally out of scope here - focus is on getting a reachable, HTTPS-backed
public API ready for closed beta testers.

## 1. Prerequisites

You must own:

- A domain (for example `api.example.com`) with DNS pointing to the server IP.
- A Linux VPS with Docker 24+ and Docker Compose v2 installed.
- TCP ports 80 and 443 open to the Internet.
- (Optional) A Firebase service account JSON for FCM push.

## 2. Files produced in this phase

| Path | Purpose |
| --- | --- |
| `deploy/docker-compose.prod.yml` | Production-oriented compose stack with Nginx and Certbot. |
| `deploy/nginx/app.conf` | Nginx reverse proxy + HTTPS termination in front of the API. |
| `.env.production.example` | Template of all production env vars (copy as `.env.production`). |

These files are not auto-applied. You run them on the target server.

## 3. One-time server setup

```bash
# On the server
cd /opt
git clone <repo-url> ai-travel-optimizer
cd ai-travel-optimizer
cp .env.production.example .env.production
# Edit and fill real secrets: POSTGRES_PASSWORD, REDIS_PASSWORD,
# JWT_SIGNING_SECRET, INTERNAL_API_KEY, LLM keys, CORS origins...
vim .env.production

# Place Firebase service account JSON if FCM is enabled
mkdir -p secrets
cp /path/to/firebase-service-account.json secrets/

# Put the OSRM graph in ./osrm-data (hue.osrm.* files)
```

## 4. Issue HTTPS certificate (Let's Encrypt)

The Nginx config expects `deploy/nginx/certs/fullchain.pem` and
`deploy/nginx/certs/privkey.pem`.

Using Certbot standalone once (before Nginx is up) is the simplest approach:

```bash
sudo docker run --rm \
  -p 80:80 \
  -v "$PWD/deploy/nginx/certs:/etc/letsencrypt" \
  certbot/certbot:latest certonly --standalone \
  -d api.example.com --agree-tos -m ops@example.com -n
```

After issuing, update the Nginx config to point at the real paths, for example:

```
ssl_certificate     /etc/nginx/certs/live/api.example.com/fullchain.pem;
ssl_certificate_key /etc/nginx/certs/live/api.example.com/privkey.pem;
```

(The `certbot` service in `docker-compose.prod.yml` handles automatic renewal
once the initial cert exists.)

## 5. Bring up the stack

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f deploy/docker-compose.prod.yml logs -f api
```

## 6. Smoke test the public endpoints

Replace `api.example.com` with your domain. The demo auth below assumes
`AUTH_MODE=hybrid` so the API key still works alongside bearer JWT. For pure
`bearer_jwt` mode, acquire a token from `/auth/token` first.

```bash
# Health
curl -sS https://api.example.com/health

# Plan
curl -sS https://api.example.com/plan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  -d '{"prompt":"Plan a Hue trip from 08:00, budget 1500000, culture + food","device_token":"beta-smoke-1"}'

# Reroute
curl -sS https://api.example.com/reroute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $INTERNAL_API_KEY" \
  -d '{"trip_id":"<from previous>","device_token":"beta-smoke-1","trigger":{"kind":"delayed","minutes_late":20}}'

# Traffic
curl -sS "https://api.example.com/traffic/check-leg?origin_lat=16.4637&origin_lon=107.5909&dest_lat=16.45&dest_lon=107.57&osrm_expected_minutes=15" \
  -H "X-API-Key: $INTERNAL_API_KEY"
```

## 7. Rollback

```bash
docker compose -f deploy/docker-compose.prod.yml down
# Keep volumes (postgis-data, redis-data) to avoid losing trip state.
```

## 8. What is NOT done here

- No multi-region / multi-replica setup.
- No managed backup. Run PostgreSQL dumps on a schedule separately.
- No synthetic monitor. Hook `/health` into your uptime tool of choice.
- Secret rotation is manual (update `.env.production` + `docker compose up -d`).
