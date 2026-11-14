# AI Competitor Intelligence Platform

[![CI Pipeline](https://github.com/janismalhotra-29/competitor-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/janismalhotra-29/competitor-intelligence/actions)
![Node Version](https://img.shields.io/badge/node-v20%2B-blue)
![NestJS](https://img.shields.io/badge/backend-NestJS%2012-red)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2016-black)
![Prisma](https://img.shields.io/badge/orm-Prisma%205.14-green)
![Playwright](https://img.shields.io/badge/crawler-Playwright-orange)
![Tests](https://img.shields.io/badge/tests-73%20passing-brightgreen)

An enterprise-grade, AI-powered competitor intelligence and website monitoring platform. It autonomously collects permitted public competitor webpages, captures high-resolution screenshots, performs pixel-by-pixel and line-by-line visual diffing, interprets strategic shifts using Multimodal LLM analysis, and delivers real-time notifications via Slack and Discord webhooks.

---

## 🚀 Key Features

* **Competitor Management:** Add, delete, and monitor target competitor URLs with automated SSRF and DNS security guards.
* **Autonomous Web Collection:** Headless Chromium crawler powered by Playwright to extract DOM text, page titles, and desktop viewport screenshots.
* **Line-by-Line Change Detection:** Differential text engine isolating additions and removals across snapshots.
* **Pixel-Level Visual Diff Heatmap:** `pixelmatch` integration highlighting visual design and layout shifts in fluorescent neon red against sharp background captures.
* **Interactive Zero-Blur Split Curtain Slider:** Interactive comparison viewer utilizing CSS `clip-path` to inspect Before vs After captures with zero ghosting or blur.
* **AI Strategic Analysis:** Multimodal LLM summarization ranking change significance (`HIGH`, `MEDIUM`, `LOW`) and competitor intent.
* **Real-Time Alerts & Webhooks:** Instant notifications dispatched to Slack and Discord channels with customizable severity thresholds.
* **Pricing Intelligence & Executive Reports:** Automated extraction of pricing tiers and one-click downloadable Markdown executive briefings.
* **Automated Background Scheduler:** In-process recurring cron crawls (`@nestjs/schedule`) with concurrency locks.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Turbopack.
* **Backend:** NestJS 12, TypeScript, Prisma ORM, SQLite.
* **Web Crawler & Visuals:** Playwright Chromium, `pixelmatch`, `pngjs`.
* **Testing & Quality:** Vitest (73 unit test suites), ESLint.
* **DevOps:** Docker, Docker Compose, GitHub Actions CI.

---

## 🐳 Quickstart with Docker (Recommended)

Run the entire platform (Frontend, Backend, Database, and Headless Browser) with a single command:

```bash
# 1. Clone repository
git clone https://github.com/janismalhotra-29/competitor-intelligence.git
cd competitor-intelligence

# 2. Start services in Docker
docker compose up --build
```

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:3001](http://localhost:3001)
* **Health Check:** [http://localhost:3001/health](http://localhost:3001/health)

---

## 💻 Local Development Setup

### Prerequisites
* Node.js `>= 20.0.0`
* npm `>= 10.0.0`

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```
Backend runs on `http://localhost:3001`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## 🧪 Testing & Verification

Run the comprehensive test suite across backend and frontend:

```bash
# Run 73 backend unit tests
cd backend
npm test

# Run frontend linter
cd ../frontend
npm run lint

# Build production artifacts
cd ../backend && npm run build
cd ../frontend && npm run build
```

---

## 📄 License
UNLICENSED — Private Academic / Enterprise Project.
