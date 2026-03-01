# Phase 2: Database & API Infrastructure

## Goal

Set up the database layer and API infrastructure. After this phase, the app has a local Postgres database running in Docker, a Drizzle ORM schema with all tables defined, working migrations, rate-limiting middleware for API routes, and a health check endpoint proving the stack works end-to-end.

## Dependencies

Install these packages:

```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit @types/node
```

- `drizzle-orm` — lightweight TypeScript ORM
- `postgres` — postgres.js driver (not `pg`, this is the modern `postgres` package)
- `dotenv` — loads `.env` for local development
- `drizzle-kit` — CLI for migrations and Drizzle Studio
- `@types/node` — Node.js types for server code

## Files to Create / Modify

### New Files — Docker & Environment

#### `docker-compose.yml` (project root)

Single Postgres service for local development:

```yaml
services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: wrkut
      POSTGRES_PASSWORD: wrkut
      POSTGRES_DB: wrkut
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

#### `.env` (project root)

```
DATABASE_URL=postgres://wrkut:wrkut@localhost:5432/wrkut
```

#### `.env.example` (project root)

Same as `.env` but checked into git — `.env` itself should be in `.gitignore`.

```
DATABASE_URL=postgres://wrkut:wrkut@localhost:5432/wrkut
```

### Modified Files

#### `.gitignore`

Add these entries if not already present:

```
# Environment
.env
.env.local

# Drizzle
drizzle/meta/
```

#### `package.json`

Add these scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down"
  }
}
```

### New Files — Database Layer

All server-side database code lives in `src/server/` to enforce a clear boundary. Client code must **never** import from `src/server/`.

#### `src/server/db/index.ts`

Database client singleton. Exports a `db` instance:

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
```

#### `src/server/db/schema.ts`

Complete database schema using Drizzle ORM. All tables are defined here upfront even though some won't be used until later phases. This prevents migration conflicts.

```ts
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Anonymous Users ─────────────────────────────────────────────
export const anonymousUsers = pgTable("anonymous_users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Routines ────────────────────────────────────────────────────
export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => anonymousUsers.id),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const routineDays = pgTable("routine_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  dayLabel: text("day_label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const routineExercises = pgTable("routine_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineDayId: uuid("routine_day_id").notNull().references(() => routineDays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(),           // text to support ranges like "8-12"
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull(),
});

// ─── Workout Sessions ────────────────────────────────────────────
export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => anonymousUsers.id),
  routineId: uuid("routine_id").notNull().references(() => routines.id),
  routineDayId: uuid("routine_day_id").notNull().references(() => routineDays.id),
  status: text("status").notNull().default("in_progress"), // "in_progress" | "completed" | "cancelled"
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  notes: text("notes"),
});

export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => routineExercises.id),
  setNumber: integer("set_number").notNull(),
  targetReps: integer("target_reps").notNull(),
  actualReps: integer("actual_reps"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── Chat ────────────────────────────────────────────────────────
export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => anonymousUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────
export const anonymousUsersRelations = relations(anonymousUsers, ({ many }) => ({
  routines: many(routines),
  workoutSessions: many(workoutSessions),
  chatConversations: many(chatConversations),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  user: one(anonymousUsers, { fields: [routines.userId], references: [anonymousUsers.id] }),
  days: many(routineDays),
  sessions: many(workoutSessions),
}));

export const routineDaysRelations = relations(routineDays, ({ one, many }) => ({
  routine: one(routines, { fields: [routineDays.routineId], references: [routines.id] }),
  exercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  day: one(routineDays, { fields: [routineExercises.routineDayId], references: [routineDays.id] }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(anonymousUsers, { fields: [workoutSessions.userId], references: [anonymousUsers.id] }),
  routine: one(routines, { fields: [workoutSessions.routineId], references: [routines.id] }),
  routineDay: one(routineDays, { fields: [workoutSessions.routineDayId], references: [routineDays.id] }),
  sets: many(workoutSets),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session: one(workoutSessions, { fields: [workoutSets.sessionId], references: [workoutSessions.id] }),
  exercise: one(routineExercises, { fields: [workoutSets.exerciseId], references: [routineExercises.id] }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(anonymousUsers, { fields: [chatConversations.userId], references: [anonymousUsers.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, { fields: [chatMessages.conversationId], references: [chatConversations.id] }),
}));
```

#### `drizzle.config.ts` (project root)

Drizzle Kit configuration:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### New Files — API Infrastructure

#### `src/server/api/response.ts`

Shared API response helpers for consistent JSON responses:

```ts
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: string;
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

Export helper functions:

- `success<T>(data: T): Response` — returns `Response.json({ success: true, data })` with status 200
- `created<T>(data: T): Response` — same but status 201
- `error(message: string, status?: number): Response` — returns `Response.json({ success: false, error: message })` with given status (default 400)

#### `src/app/+middleware.ts`

Expo Router API route middleware for rate limiting. Uses a simple in-memory store (Map) — no external dependencies needed for local dev.

Behavior:
- Only applies to routes matching `/api/*`
- Tracks requests per IP address (from `x-forwarded-for` header, falling back to `"unknown"`)
- Allows **60 requests per minute** per IP
- Returns `429 Too Many Requests` JSON response when limit is exceeded
- Cleans up expired entries every 60 seconds to prevent memory leaks

Implementation approach:

```ts
import { type ExpoRequest, type ExpoResponse } from "expo-router/server";

// In-memory rate limit store
const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

export async function middleware(request: ExpoRequest): Promise<ExpoResponse | void> {
  // Only rate-limit API routes
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api")) {
    return;
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return Response.json(
      { success: false, error: "Too many requests" },
      { status: 429 }
    ) as ExpoResponse;
  }
}
```

> **Note**: The exact middleware API depends on the version of expo-router. If `+middleware.ts` is not supported in expo-router v6, implement rate limiting as a helper function called at the top of each API route handler instead.

#### `src/app/api/health+api.ts`

Health check endpoint to verify the full stack:

```
GET /api/health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-03-01T00:00:00.000Z",
    "database": "connected"
  }
}
```

Implementation:
- Import `db` from `@/src/server/db`
- Run `SELECT 1` via `db.execute(sql`SELECT 1`)` to verify database connectivity
- If the query succeeds, return the success response
- If it fails, return `{ success: false, error: "Database connection failed" }` with status 503

## Key Technical Decisions

1. **postgres.js over pg** — `postgres` is faster, supports tagged template queries natively, and has better TypeScript support. Drizzle supports it as a first-class driver.

2. **All tables defined upfront** — even tables used in later phases (workout_sessions, chat_messages, etc.) are in the schema now. This avoids migration conflicts and lets later phases focus on API/UI work rather than schema changes.

3. **UUID primary keys** — all tables use UUIDs. The `anonymous_users` table accepts client-generated UUIDs (no `defaultRandom()`) since the client generates the ID. All other tables use `defaultRandom()`.

4. **In-memory rate limiting** — appropriate for a single-server local dev setup. No Redis dependency needed. The store auto-cleans to prevent memory leaks.

5. **`src/server/` boundary** — all database and server-only code lives in `src/server/`. This directory must never be imported from client-side code (React components, hooks, etc.). Expo's API routes (`+api.ts` files) bridge the gap.

6. **`reps` as text** — the `routine_exercises.reps` column is `text` not `integer` because workout plans commonly use ranges like "8-12" or "AMRAP".

## Database Schema Reference

This is the complete schema. All tables are created in this phase's migration:

| Table | Columns | Used In |
|---|---|---|
| `anonymous_users` | id (PK, uuid), created_at | Phase 3+ |
| `routines` | id, user_id (FK), name, description, frequency, created_at, updated_at | Phase 3+ |
| `routine_days` | id, routine_id (FK), day_label, sort_order | Phase 3+ |
| `routine_exercises` | id, routine_day_id (FK), name, sets, reps, rest_seconds, notes, sort_order | Phase 3+ |
| `workout_sessions` | id, user_id (FK), routine_id (FK), routine_day_id (FK), status, started_at, finished_at, notes | Phase 6+ |
| `workout_sets` | id, session_id (FK), exercise_id (FK), set_number, target_reps, actual_reps, completed, completed_at | Phase 6+ |
| `chat_conversations` | id, user_id (FK), created_at, updated_at | Phase 4+ |
| `chat_messages` | id, conversation_id (FK), role, content, created_at | Phase 4+ |

## Acceptance Criteria

- [ ] `docker compose up -d` starts Postgres on port 5432
- [ ] `.env` exists with `DATABASE_URL` and is gitignored
- [ ] `.env.example` is committed to the repo
- [ ] `npm run db:generate` produces a migration in `drizzle/`
- [ ] `npm run db:migrate` applies the migration — all 8 tables are created
- [ ] `npm run db:studio` opens Drizzle Studio showing all tables
- [ ] `GET /api/health` returns `{ success: true, data: { status: "ok", database: "connected" } }`
- [ ] Rate limiter returns 429 after 60 rapid requests to any `/api/*` route
- [ ] `src/server/` is never imported from any file in `src/components/` or `src/hooks/`
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
