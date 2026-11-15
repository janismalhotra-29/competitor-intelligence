# AI Competitor Intelligence Platform

An enterprise-grade, autonomous competitor monitoring system that continuously tracks permitted public webpages, captures full-viewport visual snapshots, detects meaningful DOM and pixel-level changes, performs AI-powered change summarization, and delivers real-time competitive intelligence through a modern **Xenon Design System** dashboard.

---

## 🌟 Key Capabilities & Features

### 1. 🤖 Autonomous Web Surveillance (Playwright Headless Chromium)
- Automated page crawling and full-resolution screenshot capture.
- SSRF (Server-Side Request Forgery) protection with private subnet and cloud metadata blocking (`validatePublicUrl`).
- `robots.txt` compliance checking and per-domain rate limiting.

### 2. 🔍 Pixel-Level Visual Diffing & Heatmap Engine (`pixelmatch`)
- Computes exact pixel alteration metrics and diff percentage between snapshots.
- Generates high-contrast visual difference heatmaps.
- Interactive **Before vs After Split-Curtain Slider** and side-by-side visual inspector.

### 3. 🧠 AI-Powered Change Analysis & Business Insights
- Grounded LLM pipeline (OpenAI GPT-4o / GPT-4o-mini with structured outputs).
- Analyzes DOM copy deltas, headline revisions, and navigation shifts.
- Classifies change significance (Low, Medium, High) with executive bullet summaries.

### 4. 💰 Automated Pricing Intelligence Extractor
- Discovers and parses pricing tiers (Plan name, billing period, rates, and feature breakdown).
- Cross-competitor comparison matrix table.
- Markdown Executive Intelligence Report export (`.md` download).

### 5. ⚡ Liquid Glass Command Palette (`⌘K` / `Ctrl+K`)
- Linear and Raycast-style keyboard-driven command bar.
- Instant domain filtering, tab navigation, and crawl triggers.

### 6. 🎨 Streamlined Xenon UI Suite (`@xenon-kit/web`)
- Single-surface architecture adhering strictly to hairline borders and zero card nesting.
- Self-contained competitor cards with live status badges, human-readable insights, and 1-click actions.
- Real-time in-app notification center and alert trail with unread counter sync.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    A["Frontend (Next.js 16 + Xenon Kit)"] -->|REST API / HTTP| B["Backend (NestJS API Engine)"]
    B --> C["Headless Chromium Crawler (Playwright)"]
    B --> D["Visual Diff Engine (pixelmatch + pngjs)"]
    B --> E["AI Change Analysis (OpenAI / Grounded Fallback)"]
    B --> F["Scheduler & Automation (@nestjs/schedule)"]
    B --> G["Database Layer (Prisma ORM + SQLite)"]
    C -->|Store Screenshots| H["Local File Storage (/uploads)"]
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, `@xenon-kit/web`, `@phosphor-icons/react` |
| **Backend** | NestJS 11, TypeScript, Express, `@nestjs/schedule`, `@nestjs/config` |
| **Database & ORM** | SQLite, Prisma ORM v6 |
| **Crawling & Images**| Playwright (Headless Chromium), `cheerio`, `pixelmatch`, `pngjs` |
| **AI / Intelligence** | OpenAI API (Zod structured output format), Heuristic NLP fallback |
| **Testing** | Vitest v4, React Testing Library, ESLint |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ (v24 supported)
- **npm** or **pnpm**

### 1. Backend Setup
```bash
cd backend
npm install

# Run database migrations and generate Prisma client
npx prisma db push

# Start the NestJS backend in development mode
npm run start:dev
```
The backend API will start on **`http://localhost:3001`**.

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start the Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser to view the live dashboard.

---

## 🧪 Testing & Quality Verification

All components have been rigorously verified against unit, integration, and security test suites:

- **Backend Unit Tests:** `73 / 73 passed (12 test suites)`
  ```bash
  cd backend && npm test
  ```
- **Frontend Type Safety:** `0 TypeScript errors`
  ```bash
  cd frontend && npx tsc --noEmit
  ```
- **Frontend Linter:** `0 ESLint errors`
  ```bash
  cd frontend && npm run lint
  ```
- **Production Build:** Statically prerendered with exit code 0
  ```bash
  cd frontend && npm run build
  ```

---

## 📁 Repository Structure

```text
├── backend/
│   ├── src/
│   │   ├── alerts/           # In-app notifications & webhook dispatchers
│   │   ├── automation/       # Scheduled recurring cron jobs
│   │   ├── change-detection/ # Heuristic & text diff algorithms
│   │   ├── common/           # SSRF validator, URL parser
│   │   ├── competitors/      # Domain registration & CRUD controllers
│   │   ├── crawler/          # Playwright & Cheerio web scraper
│   │   ├── pricing/          # Pricing plan extraction & markdown report generator
│   │   ├── screenshots/      # Pixelmatch image diff engine & storage controller
│   │   └── main.ts           # NestJS bootstrap with CORS
│   └── prisma/               # SQLite database schema
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router (page.tsx, layout.tsx)
│   │   ├── components/
│   │   │   ├── alerts/       # Alerts dropdown & notification feed
│   │   │   ├── changes/      # SnapshotDiffModal (Split slider, side-by-side, heatmap)
│   │   │   ├── dashboard/    # EasyCompetitorFeed, CommandPalette, MetricsRibbon
│   │   │   ├── diffs/        # VisualDiffGallery
│   │   │   └── pricing/      # PricingMatrix cross-competitor table
│   │   ├── hooks/            # Custom React hooks (useCompetitors, useAlerts)
│   │   └── lib/              # API client wrapper
└── README.md
```

---

## 📜 Active PR & Development Status
- **Active Feature Branch:** `feature/xenon-ui-integration`
- **Pull Request:** [PR #15: feat(ui): integrate modern Xenon design system and streamlined executive feed](https://github.com/janismalhotra-29/competitor-intelligence/pull/15)
- **Status:** Complete, Tested, Ready for Senior Review & Merge
