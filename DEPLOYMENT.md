# Deployment & Production Architecture Guide
**Project:** AI Competitor Intelligence Platform  
**Date:** October 19, 2026  
**Status:** Hardened & Production-Ready  

---

## 1. Hosting Architecture Evaluation

The platform comprises two core components:
1. **Backend:** NestJS TypeScript API with SQLite/Prisma ORM, Playwright Headless Chromium, and in-process Scheduler.
2. **Frontend:** Next.js 16 (App Router) with React 19, Tailwind CSS, and Turbopack.

### Database Architecture: SQLite vs PostgreSQL
- **Current Setup:** Prisma ORM with SQLite (`file:./dev.db`).
- **Compatibility Analysis:**
  - **Persistent Containers (Recommended for MVP):** Platforms like **Railway, Render, Fly.io, or VPS (Docker / Ubuntu)** support persistent disk volumes. SQLite runs with zero network latency, minimal memory footprint, and ACID transactions.
  - **Serverless Warning (Vercel Functions, AWS Lambda):** Serverless function filesystems are ephemeral and read-only. Deploying SQLite to serverless will reset database state upon container recycling.
  - **Migration Path (When scaling):** When scaling beyond a single container, change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma` and supply `DATABASE_URL="postgresql://user:password@host:5432/dbname"`. Prisma abstractions isolate application logic from database engine switches.

---

### Screenshot Storage Architecture
- **Current Setup:** Headless Playwright Chromium captures 1280x720 desktop viewports, storing PNGs in `uploads/screenshots/screenshot-${id}.png` with directory traversal protection, served securely via `GET /snapshots/:snapshotId/screenshot`.
- **Scaling Recommendation:**
  - For single-container deployment: Mount a persistent volume to `/app/backend/uploads`.
  - For multi-instance / autoscaling clusters: Transition `ScreenshotService` to upload buffers directly to an S3-compatible bucket (e.g., **Cloudflare R2, AWS S3, or Supabase Storage**).

---

### Scheduler & Background Automation
- **Current Setup:** In-process `@nestjs/schedule` runs midnight cron jobs with an execution mutex (`isRunning` lock) to prevent overlapping crawls.
- **Serverless Hosting Consideration:** In serverless environments, in-process timers are frozen when idle. For serverless deployments, use an external cron trigger (e.g., **AWS EventBridge, Cloudflare Cron Worker, or GitHub Actions**) to invoke a secured collection endpoint.

---

## 2. Environment Variables Specification

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3001` | Port on which the NestJS HTTP server listens. |
| `DATABASE_URL` | Required | `file:./dev.db` | Prisma database connection string. |
| `OPENAI_API_KEY` | Optional | *None (Grounded Mock)* | OpenAI API key for `gpt-4o-mini` structured change summaries and pricing extraction. |
| `SLACK_WEBHOOK_URL` | Optional | *None* | Incoming webhook URL for external Slack notifications. |
| `DISCORD_WEBHOOK_URL`| Optional | *None* | Incoming webhook URL for external Discord channel alerts. |
| `WEBHOOK_MIN_SEVERITY`| Optional | `HIGH` | Minimum severity threshold to trigger external webhooks (`HIGH`, `MEDIUM`, `ALL`). |

> **Security Note:** Never commit `.env` files or expose webhook URLs to client bundles. Webhook URLs are masked in backend logs (e.g. `https://hooks.slack.com/services/.../***`).

### Frontend (`frontend/.env.production`)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Optional | `http://localhost:3001` | Publicly accessible base URL of the deployed NestJS API. |

---

## 3. Production Health Monitoring

The backend exposes a lightweight, non-blocking health check endpoint:

```http
GET /health
```

**Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-10-19T09:45:00.000Z",
  "uptime": 1420.5
}
```

Use this endpoint for uptime monitors (e.g., BetterStack, UptimeRobot, AWS Route53 Health Checks, or Kubernetes Liveness/Readiness probes).

---

## 4. Production Deployment Recommendation

### Option A: Containerized Deployment (Recommended)
Deploying both backend and frontend as Docker containers on **Railway, Render, or Fly.io**:

**Backend `Dockerfile` Outline:**
```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### Option B: Split Serverless Deployment
- **Frontend:** Deploy Next.js to **Vercel** with `NEXT_PUBLIC_API_URL` pointing to backend.
- **Backend:** Deploy NestJS container to **Railway or Render** with persistent disk for SQLite and Playwright dependencies.
