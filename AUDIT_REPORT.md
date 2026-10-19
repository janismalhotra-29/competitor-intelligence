# Platform Security & Code Audit Report
**Target System:** AI Competitor Intelligence Platform  
**Audit Date:** October 19, 2026  
**Audited Branch:** `feature/audit-hardening-and-visual-capture`  
**Current Baseline Commit:** `8c447b6` (Merge PR #10)  

---

## 1. Executive Summary

A comprehensive architectural, security, and code quality audit was performed across the existing NestJS backend, Next.js frontend, SQLite/Prisma ORM layer, web crawler, change detection engine, AI summarization pipeline, scheduler, in-app alerts, snapshot inspector, and executive report generator.

### Current Health & Test Baseline:
- **Backend Tests:** 6 test suites, 24 unit tests passing (Vitest v4.1.11).
- **Backend Build:** NestJS TypeScript compilation succeeds with 0 errors.
- **Frontend Lint:** ESLint checks passed with 0 errors/warnings.
- **Frontend Build:** Next.js production build (`next build` Turbopack) succeeds with all routes statically prerendered.

### Audit Summary:
While core end-to-end functionality across Phases 1 through 9 is functional in happy-path local scenarios, **6 critical/high vulnerabilities and operational defects** and **4 medium/deployment risks** were discovered that must be remediated prior to scaling or production deployment.

---

## 2. Phase-by-Phase Verification

| Phase | Description | Audit Status | Key Notes |
| :--- | :--- | :--- | :--- |
| **Phase 1** | NestJS + Next.js + SQLite/Prisma bootstrap | ✅ Verified Functional | Prisma SQLite schema intact, standard structure maintained. |
| **Phase 2** | Competitor URL management | ⚠️ Vulnerable | Missing private IP / SSRF validation on URL registration. |
| **Phase 3** | Web crawler & initial snapshot capture | ⚠️ Vulnerable | No SSRF blocking, robots.txt ignored, rate limits absent, no response size limits. |
| **Phase 4** | Heuristic & line-by-line change detection | ⚠️ Noise Prone | Dynamic content (timestamps, counters) triggers false-positive change alerts. |
| **Phase 5** | AI/LLM change analysis & business insights | ⚠️ Unbounded/Hallucination | Mock fallback hallucinates pricing changes; prompt lacks strict grounding directives. |
| **Phase 6** | Dashboard, history & cron automation | ⚠️ Concurrency Risk | Scheduler lacks overlap mutex; `automation.service` missing unit tests. |
| **Phase 7** | In-app notification center & alerts | ⚠️ Duplicate Risk | Alerts table lacks unique constraint on `changeId`; duplicate alerts possible. |
| **Phase 8** | Snapshot diff inspector & comparison modal | ✅ Verified Functional | Line-by-line diff inspector and modal functional. |
| **Phase 9** | Structured pricing & Markdown reports | ⚠️ Mock Fabrication | Mock fallback generates fake plans (`Pro $29`) for any page containing the word "plan". |

---

## 3. Detailed Audit Findings

### Finding 1: Server-Side Request Forgery (SSRF) in URL Ingestion and Crawler
- **Severity:** 🔴 CRITICAL
- **Affected Files:**
  - `backend/src/competitors/dto/create-competitor.dto.ts`
  - `backend/src/competitors/competitors.service.ts`
  - `backend/src/crawler/crawler.service.ts`
- **Description:** 
  `CreateCompetitorDto` uses `@IsUrl({ require_tld: false })` without restricting hostnames or resolving DNS to verify target IP addresses. An attacker or malicious user can add `http://127.0.0.1:3001`, `http://localhost:3000`, cloud metadata endpoints (`http://169.254.169.254/latest/meta-data`), or private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). `CrawlerService.crawlPublicPage` then fetches this internal destination, allowing internal network reconnaissance and cloud credential exfiltration.
- **Verification Steps:**
  1. Send `POST http://localhost:3001/competitors` with body `{"url": "http://127.0.0.1:3001/alerts"}`.
  2. Notice the endpoint returns `201 Created`.
  3. Trigger snapshot collection: the crawler successfully scrapes internal backend endpoints.

---

### Finding 2: Fabricated Pricing Data in Mock/Heuristic Fallback
- **Severity:** 🔴 HIGH
- **Affected Files:**
  - `backend/src/pricing/pricing.service.ts` (Lines 69–76)
- **Description:**
  When `OPENAI_API_KEY` is absent or the API fails, `PricingService` executes a heuristic fallback that searches for `$`, `₹`, `pricing`, `/mo`, or `plan`. If any match, it injects completely fabricated tiers:
  `Starter: $0`, `Pro Plan: $29/monthly`, `Enterprise: Custom`.
  Because standard websites like Wikipedia contain the English word *"plan"* in common sentences or footers, fabricated pricing plans were created in the database and inserted into downloaded Executive Reports.
- **Verification Steps:**
  1. Add `https://wikipedia.org`.
  2. Trigger snapshot collection without an OpenAI key configured.
  3. Query `GET /competitors/:id/pricing` or view the generated report.
  4. Observe that Wikipedia is reported as having a `Pro Plan: $29/monthly` tier.

---

### Finding 3: Robots.txt Directives and Domain Rate Limits Ignored
- **Severity:** 🟠 HIGH
- **Affected Files:**
  - `backend/src/crawler/crawler.service.ts`
- **Description:**
  `CrawlerService` fetches target URLs directly without querying the site's `/robots.txt` for disallow rules or crawl-delay directives. Additionally, no domain-level rate limiting exists. Rapid or automated crawling against restrictive websites risks legal non-compliance, IP bans, or Cloudflare/bot challenge blocks.
- **Verification Steps:**
  1. Inspect `backend/src/crawler/crawler.service.ts`.
  2. Confirm total absence of robots parser or delay/rate-limiting queue.

---

### Finding 4: Uncontrolled Cron Job Concurrency and Overlap
- **Severity:** 🟠 MEDIUM-HIGH
- **Affected Files:**
  - `backend/src/automation/automation.service.ts` (Lines 16–31)
- **Description:**
  The automated crawl method `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` lacks an active execution mutex or concurrency guard. If an automated crawl takes long due to network delays, or if triggered concurrently, multiple crawl processes run simultaneously against the same competitors, generating race conditions and duplicate snapshots.
- **Verification Steps:**
  1. Inspect `automation.service.ts`.
  2. Confirm absence of an `isRunning` state check or distributed lock.

---

### Finding 5: Potential Duplicate Alert Generation
- **Severity:** 🟠 MEDIUM
- **Affected Files:**
  - `backend/src/alerts/alerts.service.ts` (Lines 8–25)
  - `backend/prisma/schema.prisma` (Alert model)
- **Description:**
  `Alert` records store `changeId` as an optional string without a unique index or uniqueness check in `AlertsService.createAlert`. Any repeated analysis or retry generates multiple identical alerts for the same change event.
- **Verification Steps:**
  1. Invoke `alertsService.createAlert` twice with the same `changeId`.
  2. Query `GET /alerts`. Both duplicate alerts are returned.

---

### Finding 6: False-Positive Change Alerts from Dynamic Content Noise
- **Severity:** 🟠 MEDIUM
- **Affected Files:**
  - `backend/src/change-detection/change-detection.service.ts`
- **Description:**
  `diff.diffLines(oldText, newText)` compares raw body text without pre-filtering dynamic tokens (such as timestamps, "last updated X minutes ago", copyright year rollover, CSRF tokens, or random ad blocks). A single dynamic number change triggers `hasChanges: true`, persisting an unnecessary `Change` entity and calling the AI summarizer.
- **Verification Steps:**
  1. Scrape a page containing dynamic timestamps twice.
  2. Note that a new `Change` record is marked with `hasChanges: true` despite zero meaningful business alterations.

---

### Finding 7: Hardcoded Frontend API URL (Deployment Blocker)
- **Severity:** 🟡 MEDIUM
- **Affected Files:**
  - `frontend/src/lib/api.ts` (Line 1)
- **Description:**
  `const API_URL = 'http://localhost:3001';` is hardcoded. Deploying the frontend to a remote hosting environment (e.g., Vercel, Netlify, ECS) will attempt to connect to the visitor's local machine rather than the deployed backend API.
- **Remediation:**
  Update to `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`.

---

### Finding 8: Missing Unit Test Coverage for Automation Service
- **Severity:** 🟡 MEDIUM
- **Affected Files:**
  - `backend/src/automation/`
- **Description:**
  While crawler, snapshots, change detection, pricing, and alerts have unit test suites (`*.spec.ts`), `AutomationService` does not have an accompanying test suite to verify cron scheduling and error handling.

---

### Finding 9: Unbounded HTTP Response Buffering
- **Severity:** 🟡 MEDIUM
- **Affected Files:**
  - `backend/src/crawler/crawler.service.ts` (Line 36)
- **Description:**
  `await response.text()` loads the complete response into memory without checking `content-length` or streaming with a maximum byte limit (e.g., 5 MB limit). A 500 MB payload or decompressor bomb could cause an out-of-memory (OOM) crash of the NestJS process.

---

### Finding 10: Serverless / Ephemeral Host Storage Incompatibility
- **Severity:** 🟡 ARCHITECTURAL NOTE
- **Affected Files:**
  - `backend/prisma/schema.prisma` (`file:./dev.db`)
  - Screenshot capture design
- **Description:**
  SQLite relies on a local writeable filesystem. On serverless environments (AWS Lambda, Vercel Functions), disk state is ephemeral and wiped between invocations. For production serverless deployments, Postgres (e.g. Supabase, Neon) or containerized persistent hosting (Docker on Railway, Render, Fly.io) is required.

---

## 4. Remediation Action Plan (Task 2 Priority)

1. **SSRF Guard & URL Sanitizer:**
   - Create a reusable `UrlValidator` utility that:
     - Disallows private IP addresses, loopback addresses (`127.0.0.1`, `localhost`, `0.0.0.0`, `::1`), link-local (`169.254.x.x`), and RFC1918 private subnets (`10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`).
     - Performs DNS resolution before crawling and blocks requests resolving to private IP space.
     - Disallows non-HTTP/HTTPS protocols (`file://`, `ftp://`, `gopher://`).
     - Disables automatic arbitrary redirect following to private destinations.
2. **Robots.txt & Rate Limiting:**
   - Implement lightweight `/robots.txt` compliance parser in `CrawlerService`.
   - Implement per-domain in-memory rate limiter with minimum 1-second delay between requests to the same origin.
3. **Robust & Grounded Pricing Extraction:**
   - Refactor heuristic fallback in `PricingService`: DO NOT fabricate plans.
   - Use strict regex to extract actual explicit currency patterns (`$XX`, `₹XX`) or return an empty array if no structured plan is found.
   - Enhance LLM prompt to forbid hallucinating pricing plans.
4. **Change Detection Dynamic Noise Filter:**
   - Normalize whitespace, strip volatile timestamps, dynamic dates, and session tokens before computing diffs.
5. **Scheduler Concurrency Mutex:**
   - Add `isRunning` guard in `AutomationService` to prevent overlapping cron runs.
6. **Duplicate Alert Prevention:**
   - Add `findFirst` check in `AlertsService.createAlert` to prevent duplicate alerts for the same `changeId`.
7. **Frontend Configurable API URL:**
   - Bind `API_URL` to `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`.
8. **Add Automation Unit Tests:**
   - Create `automation.service.spec.ts` to test cron handling, mutex lock, and error recovery.


---

## 5. Remediation & Verification Summary

All 10 findings identified during the audit have been systematically remediated, verified, and integrated with tests:

| Finding | Severity | Status | Verification Check |
| :--- | :--- | :--- | :--- |
| **1. SSRF in URL Registration & Crawler** | 🔴 CRITICAL | ✅ Resolved | `url-validator.spec.ts` & `competitors.service.spec.ts` verify rejection of loopback, RFC1918, and unresolvable IPs. |
| **2. Fabricated Pricing Data** | 🔴 HIGH | ✅ Resolved | `pricing.service.spec.ts` verifies Wikipedia/generic text returns empty plans; only genuine prices extracted. |
| **3. Robots.txt Directives & Rate Limiting** | 🟠 HIGH | ✅ Resolved | `CrawlerService` parses robots.txt with 1-hr TTL cache and throttles domain intervals (min 1s). |
| **4. Uncontrolled Cron Concurrency** | 🟠 MEDIUM-HIGH | ✅ Resolved | `automation.service.spec.ts` tests verify `isRunning` mutex prevents overlapping runs. |
| **5. Duplicate Alert Generation** | 🟠 MEDIUM | ✅ Resolved | `alerts.service.spec.ts` verifies deduplication for duplicate `changeId` alerts. |
| **6. False-Positive Dynamic Noise** | 🟠 MEDIUM | ✅ Resolved | `change-detection.service.spec.ts` verifies relative time and timestamps do not trigger changes. |
| **7. Hardcoded Frontend API URL** | 🟡 MEDIUM | ✅ Resolved | `api.ts` uses `process.env.NEXT_PUBLIC_API_URL` with localhost fallback. |
| **8. Missing Automation Unit Tests** | 🟡 MEDIUM | ✅ Resolved | Created `automation.service.spec.ts` with 4 comprehensive test cases. |
| **9. Unbounded Response Payload Buffering**| 🟡 MEDIUM | ✅ Resolved | 5 MB max body size guard and content-type whitelist added to `CrawlerService`. |
| **10. Serverless / Storage Roadmap** | 🟡 ARCHITECTURAL | ✅ Documented | Fully analyzed in `DEPLOYMENT.md` with container and storage recommendations. |
