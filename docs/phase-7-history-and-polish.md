# Phase 7: Workout History & Polish

## Goal

Build the History tab to show past workouts and apply polish across the entire app. After this phase, users can review their workout history, see detailed session breakdowns, and the app has consistent loading states, error handling, and empty states everywhere.

## Dependencies

No new packages to install. Everything needed is already available from previous phases.

## Files to Create / Modify

### New Files — API Routes

#### `src/app/api/sessions+api.ts` (modify — add GET)

**`GET /api/sessions`** — List all completed/cancelled sessions for the current user.

Query parameters:
- `limit` (optional, default 20)
- `offset` (optional, default 0)

Behavior:
1. Extract `user_id` from `X-User-Id` header
2. Query `workout_sessions` where `user_id` matches and `status` is `"completed"` or `"cancelled"`
3. Order by `started_at` descending
4. Join with `routines` to get routine name and `routine_days` to get day label
5. For each session, include:
   - Total set count and completed set count (aggregate from `workout_sets`)
   - Duration (difference between `started_at` and `finished_at`)

Response:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "...",
        "routineName": "Push Pull Legs",
        "dayLabel": "Push Day",
        "status": "completed",
        "startedAt": "2026-03-01T10:00:00.000Z",
        "finishedAt": "2026-03-01T11:15:00.000Z",
        "durationSeconds": 4500,
        "totalSets": 16,
        "completedSets": 16
      }
    ],
    "total": 42
  }
}
```

#### `src/app/api/sessions/[id]+api.ts` (modify — enhance GET)

Enhance the existing `GET /api/sessions/:id` to include full exercise and set detail for the history detail view:

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "routineName": "Push Pull Legs",
    "dayLabel": "Push Day",
    "status": "completed",
    "startedAt": "...",
    "finishedAt": "...",
    "durationSeconds": 4500,
    "notes": null,
    "exercises": [
      {
        "exerciseName": "Bench Press",
        "sets": [
          {
            "setNumber": 1,
            "targetReps": 8,
            "actualReps": 10,
            "completed": true
          }
        ]
      }
    ]
  }
}
```

### Modified Files — Route Structure

Similar to the Routine tab, History needs a nested stack for the detail view.

#### Delete `src/app/(tabs)/history.tsx` (if it's a single file)

Replace with a route group.

#### `src/app/(tabs)/history/_layout.tsx`

Stack navigator for the history section:

```tsx
import { Stack } from "expo-router";

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#09090b" },
      }}
    />
  );
}
```

#### `src/app/(tabs)/history/index.tsx`

Thin wrapper:
```tsx
export { HistoryRoute as default } from "@/src/components/routes/History";
```

#### `src/app/(tabs)/history/[id].tsx`

Thin wrapper:
```tsx
export { SessionDetailRoute as default } from "@/src/components/routes/SessionDetail";
```

### New / Modified Files — History Components

#### `src/components/routes/History/HistoryRoute.tsx` (replace placeholder)

The history list screen. Layout:

- `SafeAreaView` with `flex-1 bg-background`
- Header: "History" title (`Typography variant="h1"`)
- Content: grouped list of session cards, or empty state
- Pull-to-refresh via `RefreshControl`

**Session grouping**: Group sessions by date (e.g., "Today", "Yesterday", "March 1, 2026"). Use section headers with `Typography variant="label"`.

**Session card** for each past workout:
- `Card` component, `onPress` navigates to `/history/${session.id}`
- Top row: routine name (`Typography variant="h3"`) + status badge
  - Completed: `Badge variant="success"` — "Completed"
  - Cancelled: `Badge variant="warning"` — "Partial"
- Middle row: day label (`Typography variant="body"`)
- Bottom row: duration (formatted as "1h 15m" or "45m") + completion ratio ("16/16 sets" or "8/16 sets")
- Use `Ionicons` for subtle icons next to duration (time icon) and sets (checkmark icon)

**Empty state**:
- Centered with `Ionicons` time icon in muted color
- "No workouts yet"
- "Start a workout from your routine to see your history here"
- `Button` (primary): "Go to Routines" → navigates to Routine tab

**Pagination**: Load 20 sessions initially. Show a "Load More" button at the bottom if `total > sessions.length`. Appends to the existing list.

#### `src/components/routes/SessionDetail/index.tsx`

Re-export: `export { SessionDetailRoute } from "./SessionDetailRoute";`

#### `src/components/routes/SessionDetail/SessionDetailRoute.tsx`

Detailed view of a past workout session. Layout:

- `SafeAreaView` with `flex-1 bg-background`
- Header: back button + "Workout Details" title
- Stats summary row:
  - Duration (formatted)
  - Sets completed ("X/Y")
  - Status badge
- Exercise sections:
  - Exercise name header
  - Set table: Set #, Target, Actual, Status (checkmark or X)
  - Each set row shows target vs actual reps with visual comparison:
    - Actual ≥ Target: `text-accent` (green — met or exceeded)
    - Actual < Target: `text-warning` (amber — fell short)
    - Not completed: `text-text-secondary` with strikethrough
- Session notes (if any) at the bottom

### New Files — Shared Components (Polish)

#### `src/components/ui/Skeleton/index.tsx`

Re-export: `export { Skeleton } from "./Skeleton";`

#### `src/components/ui/Skeleton/Skeleton.tsx`

Loading skeleton placeholder. Props:

```ts
type SkeletonProps = {
  className?: string;  // width, height, border-radius
};
```

Implementation:
- `View` with `bg-zinc-800 rounded-lg` base classes
- Animated shimmer effect using `react-native-reanimated`:
  - Opacity oscillates between 0.3 and 0.7
  - Use `withRepeat(withTiming(...))` for a smooth pulse

Usage patterns (create these as composed skeleton layouts within each route component, not as separate files):
- **Routine card skeleton**: rectangle for title, shorter rectangle for description, small rectangle for badge
- **Session card skeleton**: similar layout to routine card
- **Exercise list skeleton**: repeating rows of rectangles

#### `src/components/ui/ErrorState/index.tsx`

Re-export: `export { ErrorState } from "./ErrorState";`

#### `src/components/ui/ErrorState/ErrorState.tsx`

Reusable error display. Props:

```ts
type ErrorStateProps = {
  message?: string;       // default: "Something went wrong"
  onRetry?: () => void;   // if provided, shows a "Try Again" button
};
```

Layout:
- Centered content
- Warning icon (`Ionicons` alert-circle in `destructive` color)
- Error message (`Typography variant="body"`)
- "Try Again" `Button` (secondary) if `onRetry` is provided

### Modified Files — Apply Polish to All Screens

Apply loading skeletons, error states, and empty states consistently:

#### `src/components/routes/Routine/RoutineRoute.tsx`

- **Loading**: Show 3 skeleton cards while fetching
- **Error**: Show `ErrorState` with retry if fetch fails
- **Empty**: Already has empty state from Phase 5 (verify it's still correct)

#### `src/components/routes/RoutineDetail/RoutineDetailRoute.tsx`

- **Loading**: Show skeleton for routine name + 3 skeleton day sections
- **Error**: Show `ErrorState` with retry
- **Not found**: Show a "Routine not found" message with back button

#### `src/components/routes/Home/HomeRoute.tsx`

- **Error connecting to AI**: Show error message inline in chat with retry button
- **Network error**: Show `ErrorState` if the chat API is unreachable

#### All scrollable screens

- Verify `RefreshControl` is implemented and working
- `RefreshControl` tint color: `#84cc16` (accent)

### New Files — Shared Types

#### `src/types/session.ts`

```ts
export type WorkoutSession = {
  id: string;
  routineName: string;
  dayLabel: string;
  status: "in_progress" | "completed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalSets: number;
  completedSets: number;
  notes: string | null;
};

export type SessionDetail = WorkoutSession & {
  exercises: SessionExercise[];
};

export type SessionExercise = {
  exerciseName: string;
  sets: SessionSet[];
};

export type SessionSet = {
  setNumber: number;
  targetReps: number;
  actualReps: number | null;
  completed: boolean;
};
```

### New Files — Utilities

#### `src/utils/formatDuration.ts`

Formats seconds into human-readable duration:

```ts
export function formatDuration(seconds: number): string {
  // Examples:
  // 45     → "45s"
  // 300    → "5m"
  // 3661   → "1h 1m"
  // 7200   → "2h"
}
```

Rules:
- Under 60 seconds: show seconds (e.g., "45s")
- Under 1 hour: show minutes (e.g., "45m")
- 1 hour+: show hours and minutes (e.g., "1h 15m"), omit minutes if 0

#### `src/utils/groupByDate.ts`

Groups an array of items by date for section list display:

```ts
type DateGroup<T> = {
  title: string;   // "Today", "Yesterday", "March 1, 2026"
  data: T[];
};

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): DateGroup<T>[];
```

Rules:
- Items from today → "Today"
- Items from yesterday → "Yesterday"
- Items from this year → "Month Day" (e.g., "March 1")
- Older items → "Month Day, Year" (e.g., "March 1, 2025")

### Modified Files — CLAUDE.md Update

#### `CLAUDE.md`

Add the following sections to the existing CLAUDE.md:

**Under Commands**, add:
```
npm run db:generate    # Generate Drizzle migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # Open Drizzle Studio
npm run db:up          # Start Postgres (Docker)
npm run db:down        # Stop Postgres (Docker)
```

**New section: API Routes**
```
## API Routes

POST   /api/users                          - Register anonymous user
GET    /api/health                         - Health check
POST   /api/routines                       - Create routine (nested)
GET    /api/routines                       - List user's routines
GET    /api/routines/:id                   - Get routine detail
DELETE /api/routines/:id                   - Delete routine
POST   /api/chat                           - AI chat (streaming)
POST   /api/conversations                  - Create conversation
GET    /api/conversations                  - List conversations
GET    /api/conversations/:id/messages     - Get messages
POST   /api/sessions                       - Start workout session
GET    /api/sessions                       - List past sessions
GET    /api/sessions/:id                   - Get session detail
PATCH  /api/sessions/:id                   - Update session status
PATCH  /api/sessions/:id/sets/:setId       - Update individual set
```

**New section: Database Schema**
```
## Database

Local Postgres via Docker Compose. Drizzle ORM for schema and queries.

Tables: anonymous_users, routines, routine_days, routine_exercises,
workout_sessions, workout_sets, chat_conversations, chat_messages
```

**New section: Server Code**
```
## Server Code

All server-side code lives in `src/server/`. Never import from `src/server/` in client code.

- `src/server/db/` — Drizzle client and schema
- `src/server/api/` — Response helpers, error classes, shared utilities
- `src/server/ai/` — System prompts and AI configuration
```

## Key Technical Decisions

1. **Date grouping** — sessions are grouped by relative date ("Today", "Yesterday") for recent items and absolute dates for older ones. This is a common pattern in fitness apps that helps users quickly find recent workouts.

2. **Pagination over infinite scroll** — a "Load More" button is simpler than infinite scroll and gives the user control. With 20 items per page, most users will rarely need to paginate.

3. **Skeleton loading over spinners** — skeleton screens maintain layout stability and feel faster than a centered spinner. Each screen has skeletons that match the actual content layout.

4. **Target vs actual comparison** — color-coding actual reps against targets gives quick visual feedback. Green (met/exceeded) and amber (fell short) are intuitive without needing labels.

5. **CLAUDE.md updates** — the project documentation is updated to reflect all new commands, API routes, and architecture decisions so future development sessions have full context.

## Acceptance Criteria

- [ ] History tab shows past workout sessions grouped by date
- [ ] Session cards show routine name, day label, duration, status badge, and completion ratio
- [ ] Tapping a session card navigates to the session detail screen
- [ ] Session detail shows exercise-by-exercise breakdown with target vs actual reps
- [ ] Actual reps are color-coded: green (met target), amber (fell short), muted (not completed)
- [ ] Empty state shows when no sessions exist with "Go to Routines" button
- [ ] "Load More" button appears when more sessions are available
- [ ] Pull-to-refresh works on the history list
- [ ] Skeleton loading screens appear on all list/detail screens during data fetch
- [ ] `ErrorState` component shows on API failures with retry button
- [ ] `Skeleton` component has smooth shimmer/pulse animation
- [ ] `formatDuration` correctly formats seconds to human-readable strings
- [ ] `groupByDate` correctly groups items with "Today"/"Yesterday"/date labels
- [ ] All screens have pull-to-refresh with accent-colored indicator
- [ ] CLAUDE.md is updated with new commands, API routes, and server code section
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
