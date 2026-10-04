# AI Coding Agents Instructions

This document contains explicit instructions for AI coding agents working on the AI Competitor Intelligence project. Agents must read and adhere to these guidelines before suggesting or implementing changes.

## Project Purpose
The system monitors competitor websites, stores snapshots, detects changes, and uses AI/LLM analysis to interpret and present meaningful insights on a dashboard.

## Current Tech Stack
- **Frontend:** Next.js + TypeScript
- **Backend:** NestJS + TypeScript

*(Note: The current implementation only includes the Phase 1 bootstrap. Do not assume further phases are built.)*

## Architecture & Principles
- **Build one feature at a time and keep each feature independently understandable and maintainable.**
- **Feature-wise / Fractal Decomposition:** Organize code by feature (e.g., competitors, crawler, dashboard) rather than by type (controllers, services) where possible.
- **DRY (Don't Repeat Yourself):** Abstract reusable logic.
- **SOLID Principles:** Follow object-oriented design principles, especially in the NestJS backend.
- **Separation of Concerns:** Keep frontend and backend responsibilities strictly separate. Do not put business logic directly inside UI components.
- **Dependencies:** Prefer official CLI tools and existing stable libraries. Avoid adding unnecessary dependencies.
- **Consistency:** Follow clean naming conventions. Write maintainable and readable code.

## Workflow Rules
- **Git Branches:** Always use Git branches for new features or documentation (e.g., `feature/...`, `docs/...`).
- **Commits:** Keep commits focused and meaningful. Do not modify unrelated code.
- **Pull Requests:** Use Pull Requests for introducing changes into the main branch.
- **Exploration:** Ask or inspect the existing architecture before introducing a completely new pattern.
- **Scope Discipline:** Never implement future phases unless explicitly requested by the user.
