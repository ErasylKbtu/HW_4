# StudyFlow

A responsive assignment planner for **Task 4 — Async React: Effects & API**.

Student: **Karas Yerassyl**  
Russian setup and submission instructions: [START_HERE_RU.md](START_HERE_RU.md)  


## Run

Requires Node.js 22.12+; Node.js 24 is used in the deployment workflow.

```sh
npm ci
npm run dev
```

```sh
npm run lint
npm test
npm run build
npm run preview
```

## Requirements checklist

| Requirement | Implementation |
| --- | --- |
| At least 7 meaningful detail fields | 11 displayed fields: title, course, instructor, description, due date, priority, status, estimated hours, notes, created time and updated time |
| Asynchronous API | Promises, random request delays, simulated failures and persistent browser storage in `src/api/fakeApi.js` |
| Load list with useEffect | `App.jsx`, dependency `[reload]` |
| Create, Edit, Remove | Validated form, API mutations and a deletion confirmation |
| Load details separately | `TaskDetails.jsx`; list summaries omit description, instructor, notes and timestamps |
| Update selected record through API | Mark as completed / Reopen assignment calls `updateItem` |
| Loading, error, empty, success | Separate states for list and details; pending, failure and confirmation messages for writes |
| Reload | Reload button triggers a new list request and invalidates details |
| Dependencies and cleanup | Explicit dependencies, AbortController and local active flags; native dialog cleanup |
| Race conditions | Cancel and ignore obsolete detail responses; keyed details component prevents displaying the previous card |
| Stale closures | Capture the target ID in a mutation command; merge by ID using functional state updates; preserve the latest selection |
| Prevent conflicting actions | One write at a time; UI controls lock while saving; a second lock exists in the API |
| Responsive UI | Desktop sidebar and two panels; stacked panels and usable forms on mobile |
| Hook restrictions | Only useState and useEffect; no custom Hooks, debounce or fetching libraries |
| Storage restriction | localStorage appears only in the API layer, never in React components |
| Deployment | GitHub Pages workflow included; actual publication requires uploading to the user's repository |

## API implementation choice

The assignment PDF permits implementing similar mechanics instead of using the starter verbatim. This project uses an independent implementation with the same CRUD model, Promises, random delays, errors and localStorage, plus AbortSignal support and write validation.

Starter reference: https://github.com/leravanna/fake-api

| Function | Result |
| --- | --- |
| `getItemsList({ signal })` | Array of summary records |
| `getItem(id, { signal })` | One complete record |
| `createItem(data, { signal })` | Saved new record |
| `updateItem(id, changes, { signal })` | Saved updated record |
| `deleteItem(id, { signal })` | Deleted ID |

Storage is initialized lazily on the first successful API operation. An empty array remains empty after refresh. Data belongs to the current browser and origin; the local development site and deployed site have separate data. It is a simulated backend, not a shared multi-user service.

## Structure

| File | Purpose |
| --- | --- |
| `src/App.jsx` | List state, selection, filtering, mutation commands and notifications |
| `src/api/fakeApi.js` | Delayed API, validation, storage access, one-shot errors and cancellation |
| `src/api/settings.js` | Network profiles and delay/error configuration |
| `src/data/seed.js` | Example tasks with dates relative to first use |
| `src/components/TaskList.jsx` | Assignment summaries and list states |
| `src/components/TaskDetails.jsx` | Independent details request and detail actions |
| `src/components/TaskForm.jsx` | Accessible native dialog, validation and form values |
| `src/components/NetworkPanel.jsx` | Controls for demonstrating latency and failures |
| `src/components/StateViews.jsx` | Shared loading, error and status displays |
| `src/components/Icon.jsx` | Small inline SVG icon set |
| `src/format.js` | Date formatting and overdue calculation |
| `src/styles.css` | Responsive layout and styling |
| `tests/api.test.js` | Persistence, failures, validation, empty state and cancellation tests |
| `tests/app.spec.js` | Browser tests for CRUD, races, stale closures, errors and mobile layout |
| `.github/workflows/deploy.yml` | GitHub Pages build and publication |

## Demonstrate delayed requests

Open **API playground** below the main panels.

| Profile | Delay | Random failures |
| --- | --- | --- |
| Normal | 400–1,400 ms | 6% per completed request |
| Slow | 1,800–4,200 ms | 0% |
| Reliable | 150–450 ms | 0% |
| Offline simulation | 400–800 ms | 100% |

Profile changes affect new requests. **Fail next list**, **Fail next details** and **Fail next save** each arm one failure for that request category. An aborted request does not consume the failure.

1. In Slow mode, select several cards quickly. Only the last selected card may appear.
2. Load A, click Mark as completed, then select B while saving. A changes status; B remains selected and unchanged.
3. Attempt a second write during the first. Controls remain disabled until settlement.
4. Fail a save, then retry. The form retains the entered values and persisted data stays unchanged until success.
5. Fail a list/details request, then use Try again.
6. Search for a nonexistent title to see the filtered empty state. Remove all tasks to see the genuine empty database state.

## Tests

API tests use Node's built-in test runner. Browser tests use Playwright only as a development dependency:

```sh
npx playwright install chromium
npm run test:e2e
```

One browser test deliberately makes AbortController cancellation ineffective and lets an older response arrive late. This tests the additional `active` guard rather than relying only on timer cancellation.

Verified during preparation: production build, Hooks lint, all 8 API tests and all 6 browser tests passed. The production build was also opened at desktop and mobile sizes with no browser errors or horizontal overflow.

## Deployment

Push the entire project to a new GitHub repository on branch `main`. Select **Settings → Pages → Source → GitHub Actions** and run the provided workflow. Vite's relative asset base supports a repository subpath.

The project archive includes source code and a production build. No public repository or deployed URL is created by downloading the archive.

## References

- Assignment: `04.react-homework-effects.pdf` supplied by the instructor.
- Starter API: https://github.com/leravanna/fake-api
- React useEffect: https://react.dev/reference/react/useEffect
- Vite deployment: https://vite.dev/guide/static-deploy.html
