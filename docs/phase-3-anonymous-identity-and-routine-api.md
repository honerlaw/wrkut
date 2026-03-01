# Phase 3: Anonymous Identity & Routine CRUD API

## Goal

Establish user identity without authentication and build the full routine CRUD API. After this phase, the app generates a persistent anonymous user ID on first launch, registers it with the backend, and can create/read/delete workout routines through API endpoints.

## Dependencies

```bash
npm install @react-native-async-storage/async-storage expo-crypto
```

- `@react-native-async-storage/async-storage` — persistent key-value storage on device
- `expo-crypto` — cryptographically random UUID generation

## Files to Create / Modify

### New Files — Client-Side Identity

#### `src/hooks/useUserId/index.ts`

Re-export: `export { useUserId } from "./useUserId";`

#### `src/hooks/useUserId/useUserId.ts`

Hook that manages the anonymous user ID lifecycle:

1. On mount, check AsyncStorage for key `"wrkut:user-id"`
2. If found, set state and return it
3. If not found:
   - Generate a UUID v4 using `expo-crypto` (`Crypto.randomUUID()`)
   - Store it in AsyncStorage
   - Call `POST /api/users` to register the user on the backend
   - Set state and return it
4. Returns `{ userId: string | null; isLoading: boolean }`

The hook ensures registration only happens once. If the POST fails, the local ID is still persisted (the user can be registered on the next app launch via a retry).

#### `src/components/UserProvider/index.tsx`

Re-export: `export { UserProvider, useUser } from "./UserProvider";`

#### `src/components/UserProvider/UserProvider.tsx`

React context provider that wraps the app and provides the user ID to all descendants:

```ts
type UserContextValue = {
  userId: string | null;
  isLoading: boolean;
};
```

- Uses `useUserId` internally
- Exports `UserProvider` component and `useUser` hook (via `useContext`)
- While `isLoading` is true, render a full-screen loading indicator (centered `ActivityIndicator` on `bg-background`)

#### `src/app/_layout.tsx` (modify)

Wrap the existing layout content with `<UserProvider>`:

```tsx
import { UserProvider } from "@/src/components/UserProvider";

export default function RootLayout() {
  return (
    <UserProvider>
      <View className="flex-1 bg-background">
        <Slot />
        <StatusBar style="light" />
      </View>
    </UserProvider>
  );
}
```

### New Files — API Client

#### `src/utils/apiClient.ts`

A thin fetch wrapper that all client-side API calls use. Responsibilities:

1. Prepends the base URL (use relative paths for same-origin requests, or a configurable base for production)
2. Attaches `X-User-Id` header from the provided user ID
3. Sets `Content-Type: application/json` for requests with bodies
4. Parses the JSON response and returns typed result
5. Throws on network errors

```ts
type ApiClientOptions = {
  userId: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};
```

Export a factory function:

```ts
export function createApiClient(options: ApiClientOptions) {
  return {
    async fetch<T>(path: string, requestOptions?: RequestOptions): Promise<T> {
      // implementation
    },
  };
}
```

The returned `fetch` method:
- Builds the full URL
- Attaches headers (`X-User-Id`, `Content-Type` if body present)
- Calls `fetch()`
- Parses response as JSON
- If `response.ok` is false, throws an error with the error message from the response body
- Returns the parsed `data` field from the success response

#### `src/hooks/useApiClient/index.ts`

Re-export: `export { useApiClient } from "./useApiClient";`

#### `src/hooks/useApiClient/useApiClient.ts`

Hook that creates a memoized API client using the user ID from `useUser()`:

```ts
export function useApiClient() {
  const { userId } = useUser();
  return useMemo(() => (userId ? createApiClient({ userId }) : null), [userId]);
}
```

### New Files — API Routes

#### `src/app/api/users+api.ts`

**`POST /api/users`** — Register a new anonymous user.

Request body:
```json
{ "id": "uuid-from-client" }
```

Behavior:
1. Validate that `id` is present and is a valid UUID format
2. Insert into `anonymous_users` table with the provided `id`
3. If the user already exists (unique constraint violation), return success anyway (idempotent)
4. Return `201` with the user record

Response:
```json
{
  "success": true,
  "data": { "id": "...", "createdAt": "..." }
}
```

#### `src/app/api/routines+api.ts`

**`POST /api/routines`** — Create a new routine with its full nested structure in a single transaction.

Request body:
```json
{
  "name": "Push Pull Legs",
  "description": "3-day split focusing on compound movements",
  "frequency": "3x per week",
  "days": [
    {
      "dayLabel": "Push Day",
      "sortOrder": 0,
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Focus on controlled eccentric",
          "sortOrder": 0
        }
      ]
    }
  ]
}
```

Behavior:
1. Extract `user_id` from `X-User-Id` header
2. Validate the request body structure
3. Within a single database transaction:
   - Insert the routine
   - Insert all routine_days
   - Insert all routine_exercises for each day
4. Return `201` with the full routine including nested days and exercises

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Push Pull Legs",
    "description": "...",
    "frequency": "3x per week",
    "days": [
      {
        "id": "...",
        "dayLabel": "Push Day",
        "sortOrder": 0,
        "exercises": [
          {
            "id": "...",
            "name": "Bench Press",
            "sets": 4,
            "reps": "8-10",
            "restSeconds": 90,
            "notes": "Focus on controlled eccentric",
            "sortOrder": 0
          }
        ]
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**`GET /api/routines`** — List all routines for the current user.

Behavior:
1. Extract `user_id` from `X-User-Id` header
2. Query routines where `user_id` matches, ordered by `created_at` descending
3. Include nested days (ordered by `sort_order`) and exercises (ordered by `sort_order`) using Drizzle's `with` clause
4. Return the list

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Push Pull Legs",
      "days": [{ "dayLabel": "Push Day", "exercises": [...] }],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `src/app/api/routines/[id]+api.ts`

**`GET /api/routines/:id`** — Get a single routine with full nested data.

Behavior:
1. Extract `user_id` from `X-User-Id` header
2. Query the routine by `id` where `user_id` matches
3. Include nested days and exercises
4. Return 404 if not found or doesn't belong to this user

**`DELETE /api/routines/:id`** — Delete a routine.

Behavior:
1. Extract `user_id` from `X-User-Id` header
2. Verify the routine exists and belongs to the user
3. Delete the routine (cascade deletes days and exercises)
4. Return `200` with `{ success: true, data: null }`

### New Files — Shared Types

#### `src/types/routine.ts`

Client-side type definitions for routines. These mirror the API response shapes:

```ts
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  sortOrder: number;
};

export type RoutineDay = {
  id: string;
  dayLabel: string;
  sortOrder: number;
  exercises: Exercise[];
};

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  frequency: string | null;
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
};

export type CreateRoutineInput = {
  name: string;
  description?: string;
  frequency?: string;
  days: {
    dayLabel: string;
    sortOrder: number;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      restSeconds?: number;
      notes?: string;
      sortOrder: number;
    }[];
  }[];
};
```

### New Files — Server Helpers

#### `src/server/api/getUserId.ts`

Helper to extract and validate the user ID from a request:

```ts
export function getUserId(request: Request): string {
  const userId = request.headers.get("X-User-Id");
  if (!userId) {
    throw new ApiError("Missing X-User-Id header", 401);
  }
  return userId;
}
```

#### `src/server/api/errors.ts`

Custom error class for API error handling:

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}
```

Use this in API route handlers with a try/catch that converts `ApiError` to the appropriate HTTP response via the `error()` helper from Phase 2.

## Key Technical Decisions

1. **Client-generated UUIDs** — the client generates the user ID rather than the server. This allows the ID to be stored locally immediately without waiting for a server round-trip. The server just validates and records it.

2. **Idempotent user registration** — `POST /api/users` succeeds even if the user already exists. This handles the case where the app crashes after storing the ID locally but before the registration response arrives.

3. **Single-transaction routine creation** — the entire routine (with days and exercises) is created in one transaction. This prevents partial data from orphaned inserts and simplifies error handling.

4. **`X-User-Id` header pattern** — rather than sessions or tokens, every API request includes the user ID in a header. This is simple and stateless. The API client utility handles this automatically so components never deal with it directly.

5. **Factory pattern for API client** — `createApiClient({ userId })` returns a client instance. This is memoized in the `useApiClient` hook so it's stable across re-renders.

## Acceptance Criteria

- [ ] First app launch generates a UUID and stores it in AsyncStorage
- [ ] Subsequent launches reuse the stored UUID (check with `AsyncStorage.getItem`)
- [ ] `POST /api/users` creates the user in the database
- [ ] `POST /api/users` with the same ID is idempotent (returns success)
- [ ] `UserProvider` wraps the app; `useUser()` returns the user ID in child components
- [ ] `POST /api/routines` creates a routine with nested days and exercises in one transaction
- [ ] `GET /api/routines` returns all routines for the current user with nested data
- [ ] `GET /api/routines/:id` returns a single routine with nested data
- [ ] `GET /api/routines/:id` returns 404 for routines belonging to other users
- [ ] `DELETE /api/routines/:id` removes the routine and cascades to days/exercises
- [ ] All API responses follow the `{ success, data/error }` shape
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
