# Backend

One backend for the web app and the future iOS and Android apps.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| API | Next.js Route Handlers at `/api/v1/*` | Ships with the app, one deploy, no second server to run. |
| Database | Postgres | One database for accounts, matchmaking, chat, group trips and bookings. Works with Neon, Supabase, RDS or Vercel Postgres. |
| ORM and migrations | Drizzle | Typed queries, plain SQL migrations in `drizzle/`. |
| Local database | PGlite (Postgres compiled to WASM) | `npm run dev` works with no database to install. Data lives in `.data/pglite`. |
| Auth | Email and password (scrypt), session tokens | Web uses an httpOnly cookie. Native apps send `Authorization: Bearer <token>`; signup and login return the token in the body. Only a SHA-256 hash of each token is stored. |
| Validation | Zod | Every request body is checked; errors come back as `{ error: { code, message, details } }`. |
| Tests | Vitest against an in-memory database | `npm test`. |

## Running it

```bash
npm install
npm run dev          # API + app on http://localhost:3000, embedded Postgres in .data/pglite
npm test             # API tests, in-memory Postgres
```

Production:

```bash
DATABASE_URL=postgres://… npm run db:migrate   # once per deploy
DATABASE_URL=postgres://… npm run build && npm start
```

Changing the schema: edit `src/server/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`.

Environment variables are listed in `.env.example`.

## Code map

- `src/server/db/schema.ts`: tables.
- `src/server/db/index.ts`: picks Postgres or PGlite, runs local migrations, seeds demo travelers.
- `src/server/http.ts`: the small router, auth guard, validation and error format.
- `src/server/auth.ts`: password hashing and sessions.
- `src/server/api/*.ts`: endpoints by area.
- `src/server/demo.ts`: demo travelers t1–t5 and the starter "Bali villa crew" trip.
- `src/lib/matching.ts`: compatibility scoring, shared by the app and the server.
- `src/lib/api.ts`, `src/lib/session.ts`: the app's API client and sign-in state.

## How the app uses it

Signed out, the app works as before on demo data saved on the device. Signed in (Profile, then "Create an account"):

- Travel together (discover, likes, matches, chat, group trips, plans, votes, expenses, settle-up) reads and writes the server.
- Bookings, visa applications and travel preferences save to the account. Anything booked on the device before signing in is uploaded at sign-in.

## Endpoints

All under `/api/v1`. "Auth" means a session cookie or bearer token is required.

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| GET | `/health` | | Database check. |
| POST | `/auth/signup` | | `{ email, password, name }`. Creates the account, returns `{ user, prefs, profile, token, expiresAt }` and sets the cookie. |
| POST | `/auth/login` | | `{ email, password }`. Same response. |
| POST | `/auth/logout` | | Ends the session. |
| GET | `/me` | Auth | Account, booking preferences and traveler profile. |
| PATCH | `/me` | Auth | Update any of: name, homeAirport, seat, cabin, meal, notifications, age, gender, fromCity, bio, interests, style, budget. |
| GET | `/together` | Auth | Everything the Travel together screens need, in the app's `TogetherState` shape. |
| GET, PUT | `/match/prefs` | Auth | Matchmaking preferences. Saving them also sets your own trip, which makes you discoverable. |
| GET | `/match/candidates` | Auth | People to swipe on, filtered and ranked by compatibility. |
| POST | `/match/swipes` | Auth | `{ targetId, action: "like" \| "pass" \| "block" }`. Returns `{ match }`. A like back makes a match. |
| GET, POST | `/chats/:userId/messages` | Auth | Chat with a match. POST `{ text }`. |
| POST | `/groups` | Auth | `{ withUserId }`. Start a group trip with a match. |
| GET | `/groups/:id` | Auth | One group trip (members only). |
| POST | `/groups/:id/plan` | Auth | `{ title }`. Add an idea. |
| POST | `/groups/:id/plan/:itemId/vote` | Auth | One vote per traveler. |
| POST | `/groups/:id/expenses` | Auth | `{ title, amount, paidBy, splitWith }`. Amount in dollars. |
| POST | `/groups/:id/settlements` | Auth | `{ from, to, amount }`. Only the payer or the person paid can record it. |
| GET, POST | `/bookings` | Auth | Your flight and hotel bookings (`Trip` shape, totals in cents). POST is idempotent by booking reference. |
| POST | `/bookings/:id/cancel` | Auth | Mark a booking cancelled. |
| GET, POST | `/visa-applications` | Auth | Your visa applications. |
| POST | `/reports` | Auth | `{ targetId, reason, details?, context? }`. Reports and blocks. Saves the person's profile and their last 20 messages to you as evidence, and pings `MODERATION_WEBHOOK_URL`. |
| GET | `/admin/me` | Auth | `{ moderator }`: whether you can review reports. |
| GET | `/admin/reports` | Moderator | The queue. `?status=open` (default), `dismissed`, `suspended` or `all`. |
| POST | `/admin/reports/:id` | Moderator | `{ action: "dismiss" \| "suspend" \| "reopen" }`. Suspend signs the person out, hides them, blocks sign-in and closes their other open reports. |
| POST | `/admin/users/:id/unsuspend` | Moderator | Lift a suspension. |

In Travel together responses, the signed-in traveler is always `"me"`, which is how the app already refers to them.

## Safety and moderation

What the App Store (guideline 1.2) and Google Play ask of apps where strangers talk:

- **Offensive-content filter** (`src/lib/moderation.ts`). Chat messages, names, bios, interests, group trip titles, plan ideas and expense titles are checked on the server, which answers `422 offensive_content`. The app runs the same check first, so people see why before anything is sent. It matches whole words with leetspeak and stretched letters undone, in English and romanised Hindi and Urdu, and leaves out words with innocent meanings. Add words to the lists there; `src/lib/moderation.test.ts` lists phrases that must keep passing.
- **Report and block** from a profile, the Discover safety sheet or a chat. The block is immediate both ways; the report lands in the queue.
- **Review queue** at `/admin/reports` (also linked from the Account screen) for the emails in `UNTHINKED_ADMIN_EMAILS`. Set `MODERATION_WEBHOOK_URL` to a Slack or Discord webhook so each report pings you; both stores expect action within 24 hours.
- **Suspension** hides the person from everyone, ends their sessions and stops them signing in. Deleting the account is left to the person.

## Demo content

Five demo travelers (Aisha, Rahul, Sofia, Lucas, Mei) are seeded so Discover isn't empty. Those who "like you" match straight away and send a greeting, and they auto-reply in chat. Each new account also gets the sample "Bali villa crew" trip. Set `UNTHINKED_DEMO=0` to turn all of this off before launch.

## Not done yet

- Real flight and hotel inventory, pricing and payments. Bookings are stored as the app confirms them; when suppliers and a payment provider are added, pricing and confirmation should move server-side.
- Password reset, email verification and sign in with Apple and Google (Apple requires Sign in with Apple if other social logins are offered).
- Rate limiting on login and signup.
- Real-time chat (polling the chat endpoint works today; websockets or a push service later).
- Push notifications.
- Photo upload for traveler profiles.
