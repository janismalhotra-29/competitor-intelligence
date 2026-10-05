---
name: frontend-architecture
description: Enforces the clean architecture pattern (Page -> Hook -> Service -> API Client) and the separation of queries and mutations for all frontend features.
---

# Frontend Architecture Skill

When building or modifying frontend React/Next.js features in this project, you MUST strictly adhere to the following architectural flow:

## The Flow: Page -> Hook -> Service -> API Client

1. **Page (UI Layer)**
   - Files like `page.tsx` or other view components must remain "dumb".
   - They should only handle rendering the UI and passing props.
   - They must NOT contain `useState` or `useEffect` for data fetching.
   - They must NOT call `fetch` directly.
   - They should consume logic by calling a single custom hook: `const { queries, mutations } = useMyFeature()`.

2. **Hook (State & Logic Layer)**
   - Create custom hooks (e.g., `useCompetitors.ts`) inside the `src/hooks` directory.
   - The hook manages all React state (`loading`, `error`, `data`, etc.).
   - **Crucial:** The hook must return two distinct objects:
     - `queries`: Contains read-only state and functions (e.g., `data`, `loading`, `loadData()`).
     - `mutations`: Contains write-only functions and their specific loading states (e.g., `addData()`, `deleteData()`, `isAdding`).

3. **API Client (Network Layer)**
   - Create functions inside `src/lib/api.ts` (or feature-specific API files) to handle actual network requests.
   - These functions are responsible for the `fetch` API calls, setting headers, and returning parsed JSON.
   - The Hook calls these API Client functions.

By following this pattern, we ensure the UI is decoupled from business logic and data fetching, making the codebase scalable and easy to test.
