# CricHub

CricHub is a Phase 1 MVP for cricket captains who need one place to run weekly Saturday admin.

It is built as a local-first Next.js app for:

- Creating fixtures with home/away, ground, scorer, umpire, and opposition notes.
- Maintaining a squad database with roles, wicketkeeper flags, junior DOBs, and guardian consent notes.
- Collecting availability through fixture-specific CricHub links.
- Selecting the XI with availability, role markers, and junior warnings visible.
- Generating copy/paste WhatsApp messages for availability, reminders, team announcements, home opposition info, payment requests, and post-match admin.
- Tracking match admin tasks, Play-Cricket/manual result reminders, match fees, and umpire/scorer expenses.

## Tech Stack

- Next.js and TypeScript
- Tailwind CSS
- Prisma with SQLite
- Vitest for focused rule/message tests

## Getting Started

Install dependencies:

```bash
npm install
```

Create the local SQLite database and Prisma client:

```bash
npm run db:push
```

Optionally seed reusable message templates:

```bash
npm run db:seed
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Captain Workflow

1. Add regular players in `Squad`, including junior DOB and consent details where relevant.
2. Add the next match in `Fixtures`.
3. Open the fixture availability link and copy the availability message from `Messages` into WhatsApp.
4. Review responses and save the XI in `Selection`.
5. Check junior warnings before announcing the team.
6. Use `Messages` to copy the team announcement and home opposition information.
7. After the game, use `Admin` for result workflow reminders and `Fees` for match fee and expense tracking.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run db:generate
npm run db:push
npm run db:seed
```

## Phase 1 Boundaries

Phase 1 deliberately does not include WhatsApp Business API automation, Play-Cricket API import/export, Google Sheets sync, payment provider integration, scorebook OCR, or multi-team club pooling. Those are better added once the weekly captain workflow has been used for real matches.

