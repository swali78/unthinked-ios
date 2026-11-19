# Testing

Two layers of automated tests keep the app working as it grows.

| Command | What it runs |
| --- | --- |
| `npm test` | Unit tests (Vitest) for the data and logic in `src/lib` (matchmaking scores, cost splitting, flight and hotel search, fares and seats, passenger and visa rules), plus the API tests in `src/server` on an in-memory Postgres. |
| `npm run test:e2e` | End-to-end tests (Playwright) that click through the real app on a phone and a desktop screen. Run `npm run build` first. |
| `npm run test:all` | Lint, type check, unit tests, build and end-to-end tests, in that order. |

GitHub Actions runs all of this on every pull request and every push to `main` (`.github/workflows/test.yml`).

## Unit tests

App logic tests live in `tests/unit` and run twice, in India time and in New York time, because date maths that is right on one side of UTC is often a day off on the other.

API tests live next to the server code (`src/server/*.test.ts`) and each file gets its own in-memory Postgres (PGlite). They cover accounts, matching, chat, group trips (including one vote per person), bookings and visa applications.

## End-to-end tests

They live in `tests/e2e` and cover:

- first visit and the welcome screens
- every screen loading without errors or sideways scrolling
- booking a flight: search, fare, seat, passenger, pay, then trips and wallet
- booking a hotel: search, room, guest details, pay
- applying for an eVisa: details, passport scan, photo checks, travel dates, pay, tracking
- Travel together: match preferences, connecting, the match screen, chat, group trip plans, splitting costs and settling up
- the AI chat, using the offline assistant (`UNTHINKED_MOCK_AI=1`) so tests never call a real model
- the app and backend together (`integration.spec.ts`): signing up and in, server validation errors, matches and chats saved to the account, trip votes and expenses stored on the server, a second device seeing the same account, a booking made before sign-up moving into the account, and signing out

The test server runs with a fresh in-memory database (`PGLITE_DIR=memory://`), and each test starts with empty device storage, so the demo data is the same every run.
To debug a failure, run `npx playwright test --ui` or `npx playwright show-trace test-results/<test>/trace.zip`.
