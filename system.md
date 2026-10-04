# System Functional Flow

This document describes the high-level functional flow and responsibilities of the AI Competitor Intelligence system.

## High-Level Flow

```text
User
  ↓
Competitor URLs
  ↓
Scheduler
  ↓
Public Web Collection
  ↓
Text + Metadata + Screenshots
  ↓
Snapshot Storage
  ↓
Change Detection
  ↓
Vision / LLM Analysis
  ↓
AI Summary / Classification
  ↓
Dashboard / Alerts
```

## Stage Responsibilities

- **User / Competitor URLs:** The entry point where users define which competitors and specific URLs they want to track.
- **Scheduler:** Triggers periodic checks (e.g., daily or weekly) for the tracked URLs.
- **Public Web Collection (Crawler):** The actual collection layer. Responsible solely for fetching data from the web.
- **Snapshot Storage:** Saves the raw HTML, extracted text, metadata, and screenshots into the database/file system.
- **Change Detection:** Compares the latest snapshot against previous snapshots to identify structural or textual differences.
- **Vision / LLM Analysis:** Analyzes the differences identified by the change detection layer. 
- **Dashboard / Alerts:** Presents the human-readable insights to the end-user.

### Important Distinction: The Role of the LLM
**The LLM is NOT responsible for crawling the website.** The crawler/collection layer handles data gathering, and the change-detection layer identifies differences. 

The LLM is primarily responsible for:
- Interpreting detected changes.
- Summarizing changes.
- Classifying and prioritizing changes.
- Converting technical/raw differences into human-readable insights.
- *(Note: A vision-capable model may be used for screenshot/visual change interpretation).*

## System Guardrails
To ensure ethical and stable operation, the system must adhere to the following guardrails:
- Monitor permitted public pages only.
- Respect `robots.txt` where applicable.
- Respect website terms and rate limits.
- Avoid private or authenticated content.
- Minimize unnecessary requests to external sites.
- Do not send unnecessary or excessive website content to the LLM (only send relevant differences or targeted snapshots).
