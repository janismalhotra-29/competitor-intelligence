# Product Requirements Document (PRD)

## Project Overview
The **AI Competitor Intelligence** system allows a user to provide competitor website URLs. The system periodically monitors permitted public webpages, collects relevant content and screenshots, compares new snapshots with previous snapshots, detects meaningful changes, uses AI/LLM analysis to interpret important changes, and presents the results through a dashboard and alerts.

## A. Problem
- Teams currently monitor competitor websites manually.
- Important pricing and feature changes can be easily missed.
- Information is spread across multiple pages and platforms.
- Small, irrelevant changes create noise.
- Meaningful changes need immediate prioritization and contextualization.

## B. Solution
- User adds competitor URLs to the system.
- The system periodically checks permitted public pages.
- The system stores snapshots of these pages.
- A change detection engine identifies differences between snapshots.
- AI summarizes and classifies meaningful changes.
- A central dashboard presents insights and historical data.

## C. MVP Scope (Planned)
The initial MVP will encompass the following features:
- Add competitor URLs
- View tracked competitors
- Periodic public-page collection
- Store snapshots of pages
- Text and price extraction
- Screenshot capture
- Change detection between snapshots
- AI/LLM summary of changes
- Basic dashboard
- Change history
- Basic alerts if appropriate

## D. Explicitly OUT OF SCOPE for Initial MVP
The following features are **not** part of the MVP:
- Accessing private or authenticated pages
- Aggressive web crawling
- Bypassing `robots.txt` or website restrictions
- Unauthorized data collection
- Complex autonomous decision making

## E. Example Workflow
**Old Website State:**
> Pro Plan = ₹999

**New Website State:**
> Pro Plan = ₹799

**System Action:**
Detects the pricing change → sends the relevant raw change to the LLM → LLM generates a concise, readable summary → dashboard displays the updated insight to the user.
