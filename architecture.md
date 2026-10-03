# Technical Architecture

This document outlines the current technical architecture and the planned future structure for the AI Competitor Intelligence system.

## Current Stack
- **Frontend:** Next.js, TypeScript
- **Backend:** NestJS, TypeScript

*(Note: Specific databases and LLM providers are implementation decisions that will be made and documented in their respective phases.)*

## Future Feature-Wise Structure
The project will follow a feature-wise (fractal) decomposition. These modules should be introduced progressively rather than all implemented immediately.

### Frontend Example Structure
```text
frontend/
└── features/
    ├── competitors/
    ├── dashboard/
    ├── changes/
    └── alerts/
```

### Backend Example Structure
```text
backend/
└── src/
    ├── competitors/
    ├── crawler/
    ├── snapshots/
    ├── change-detection/
    ├── ai-analysis/
    ├── scheduler/
    └── alerts/
```

## Module Responsibilities
- **Competitors:** Manage competitor URLs and profiles.
- **Crawler:** Collect permitted public webpage data.
- **Snapshots:** Store historical versions of collected data.
- **Change Detection:** Compare snapshots for differences.
- **AI Analysis:** Interpret and summarize detected changes using an LLM.
- **Scheduler:** Trigger periodic crawling checks.
- **Dashboard:** Present insights and analytics to the user.
- **Alerts:** Notify users of important changes.

## Intended Data Flow
The system operates on the following general data flow pattern:

1. **Frontend** triggers an action or requests data.
2. → **NestJS API** receives the request.
3. → **Feature Service** processes the business logic.
4. → **Database / External Service** stores or retrieves data.
5. → **Processing Pipeline** handles specialized logic (e.g., crawling, diffing).
6. → **AI Analysis** interprets the pipeline output.
7. → **API Response** is formulated and sent back.
8. → **Frontend** displays the result to the user.
