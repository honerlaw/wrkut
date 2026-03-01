# Phase 6: Active Workout Tracking

## Goal

Build the active workout experience — the core feature of the app. After this phase, users can start a workout from a routine day, log sets with actual reps, use a rest timer between sets, track elapsed time, and complete or stop workouts. The workout runs as a full-screen modal overlay on top of the tab navigation.

## Dependencies

```bash
npm install expo-haptics
```

- `expo-haptics` — haptic feedback on timer completion and set logging
- `react-native-reanimated` (already installed) — animated circular timer

## Database Tables Used

These tables were already created in Phase 2's migration:

- `workout_sessions` — tracks each workout instance
- `workout_sets` — tracks individual sets within a session

## Files to Create / Modify

### New Files — API Routes

#### `src/app/api/sessions+api.ts`

**`POST /api/sessions`** — Start a new workout session.

Request body:
```json
{
  "routineId": "uuid",
  "routineDayId": "uuid"
}
```

Behavior:
1. Extract `user_id` from `X-User-Id` header
2. Fetch the routine day's exercises (with their sets count and reps)
3. In a single transaction:
   - Create a `workout_sessions` row with status `"in_progress"`
   - Pre-populate `workout_sets` rows for every exercise/set combination
     - For each exercise: create N rows (where N = `exercise.sets`)
     - `set_number`: 1-indexed
     - `target_reps`: parse the first number from the `reps` text (e.g., "8-12" → 8, "10" → 10)
     - `actual_reps`: null
     - `completed`: false
4. Return the full session with nested sets

Response:
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "routineId": "...",
    "routineDayId": "...",
    "status": "in_progress",
    "startedAt": "...",
    "exercises": [
      {
        "exerciseId": "...",
        "exerciseName": "Bench Press",
        "restSeconds": 90,
        "sets": [
          {
            "id": "set-uuid",
            "setNumber": 1,
            "targetReps": 8,
            "actualReps": null,
            "completed": false
          }
        ]
      }
    ]
  }
}
```

#### `src/app/api/sessions/[id]+api.ts`

**`GET /api/sessions/:id`** — Get session with all sets.

Returns the same shape as the POST response, used to resume a session if the app restarts.

**`PATCH /api/sessions/:id`** — Update session status.

Request body:
```json
{
  "status": "completed" | "cancelled",
  "notes": "optional session notes"
}
```

Behavior:
- Set `status` and `finished_at` (current timestamp)
- If completing, verify at least one set is marked completed
- Return the updated session

#### `src/app/api/sessions/[id]/sets/[setId]+api.ts`

**`PATCH /api/sessions/:id/sets/:setId`** — Update an individual set.

Request body:
```json
{
  "actualReps": 10,
  "completed": true
}
```

Behavior:
- Update the set's `actual_reps`, `completed`, and `completed_at` (if completing)
- Verify the set belongs to the given session and the session belongs to the user
- Return the updated set

### Modified Files — Navigation

#### `src/app/_layout.tsx` (modify)

Add a modal route for the active workout. Change the root layout from `Slot` to `Stack` with a modal presentation:

```tsx
export default function RootLayout() {
  return (
    <UserProvider>
      <View className="flex-1 bg-background">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </View>
    </UserProvider>
  );
}
```

#### `src/app/workout.tsx`

Thin wrapper:
```tsx
export { ActiveWorkoutRoute as default } from "@/src/components/routes/ActiveWorkout";
```

### Modified Files — Routine Detail

#### `src/components/routes/RoutineDetail/DaySection.tsx` (modify)

Replace the "coming soon" alert with actual navigation. The `onStartWorkout` callback now:

```ts
router.push({
  pathname: "/workout",
  params: { routineId: routine.id, routineDayId: day.id },
});
```

Pass `routineId` down from `RoutineDetailRoute` to `DaySection`.

### New Files — Workout Components

#### `src/components/routes/ActiveWorkout/index.tsx`

Re-export: `export { ActiveWorkoutRoute } from "./ActiveWorkoutRoute";`

#### `src/components/routes/ActiveWorkout/ActiveWorkoutRoute.tsx`

The full-screen workout modal. Layout:

- `SafeAreaView` with `flex-1 bg-background`
- Header: elapsed timer (left), progress bar (center), stop button (right)
- `ScrollView` of exercise blocks
- Rest timer overlay (when active)

State management:
- Get route params: `routineId`, `routineDayId`
- On mount: call `POST /api/sessions` to create the session and get pre-populated sets
- Track local state for the session and all sets (updates are optimistic — PATCH calls happen in background)
- Track `elapsedSeconds` with a `setInterval` (start on mount, clear on unmount)
- Track `activeRestTimer: { exerciseId: string; duration: number } | null`

Data shape in state:
```ts
type WorkoutExercise = {
  exerciseId: string;
  exerciseName: string;
  restSeconds: number | null;
  sets: WorkoutSet[];
};

type WorkoutSet = {
  id: string;
  setNumber: number;
  targetReps: number;
  actualReps: number | null;
  completed: boolean;
};
```

#### `src/components/routes/ActiveWorkout/WorkoutHeader.tsx`

Header bar for the workout. Props:

```ts
type WorkoutHeaderProps = {
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  onStop: () => void;
};
```

Layout:
- Left: elapsed time formatted as `MM:SS` or `H:MM:SS`
- Center: progress bar showing `completedSets / totalSets`
  - Use a `View` with `bg-muted rounded-full h-2 flex-1 mx-4` as the track
  - Inner `View` with `bg-accent rounded-full h-2` and width as percentage
- Right: "Stop" button (destructive ghost style, `Pressable` with X icon)

#### `src/components/routes/ActiveWorkout/ExerciseBlock.tsx`

Block for a single exercise within the workout. Props:

```ts
type ExerciseBlockProps = {
  exercise: WorkoutExercise;
  onCompleteSet: (setId: string, actualReps: number) => void;
  onUncompleteSet: (setId: string) => void;
};
```

Layout:
- Exercise name as header (`Typography variant="h3"`)
- Rest time info (`Typography variant="caption"`): "90s rest between sets"
- Table-style rows for each set:
  - Column headers: "Set", "Target", "Reps", "" (checkmark)
  - Each `SetRow` component

#### `src/components/routes/ActiveWorkout/SetRow.tsx`

Individual set row. Props:

```ts
type SetRowProps = {
  set: WorkoutSet;
  onComplete: (actualReps: number) => void;
  onUncomplete: () => void;
};
```

Layout:
- Row: `flex-row items-center py-2 border-b border-border`
- Set number column: "1", "2", etc. in a small circle
- Target column: target reps (`Typography variant="body"`)
- Reps input: `TextInput` (numeric keyboard) pre-filled with target reps, editable
  - When completed: show the actual reps value, dimmed
- Checkmark button:
  - Uncompleted: circle outline, tapping it marks the set as complete
  - Completed: filled lime circle with checkmark icon
  - Tap on completed set toggles it back to uncompleted

Complete set flow:
1. User enters actual reps (or keeps the pre-filled target)
2. Taps the checkmark
3. Set is marked completed locally (optimistic)
4. `PATCH /api/sessions/:id/sets/:setId` fires in background
5. Haptic feedback (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`)
6. If the exercise has `restSeconds`, auto-start the rest timer

#### `src/components/routes/ActiveWorkout/RestTimer.tsx`

Animated circular countdown timer. Props:

```ts
type RestTimerProps = {
  duration: number;        // seconds
  onComplete: () => void;
  onSkip: () => void;
};
```

Layout:
- Full-screen semi-transparent overlay (`bg-black/70`)
- Centered circular timer:
  - Outer circle with animated stroke (use `react-native-reanimated` with SVG or a custom approach)
  - Time remaining in large text (`Typography variant="h1"`) centered inside
  - "Skip" button below the circle (`Button variant="ghost"`)

Animation:
- The circle's stroke animates from full to empty over `duration` seconds
- Use `useSharedValue` and `useAnimatedStyle` from reanimated
- Color transitions from `accent` to `warning` to `destructive` as time progresses (final 25% is red)

On completion:
- Haptic feedback (`Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`)
- Brief pause (500ms), then auto-dismiss
- Call `onComplete` callback

#### `src/components/routes/ActiveWorkout/hooks/useWorkoutSession.ts`

Central hook managing the workout session state:

```ts
type UseWorkoutSessionReturn = {
  session: WorkoutSession | null;
  exercises: WorkoutExercise[];
  isLoading: boolean;
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  activeRestTimer: { duration: number } | null;
  completeSet: (setId: string, actualReps: number) => void;
  uncompleteSet: (setId: string) => void;
  dismissRestTimer: () => void;
  stopWorkout: () => Promise<void>;
  completeWorkout: () => Promise<void>;
};
```

Responsibilities:
1. Create session on mount via POST
2. Manage elapsed time counter
3. Handle set completion (optimistic update + API call)
4. Auto-trigger rest timer after set completion
5. Track overall progress
6. Handle stop (cancel) and complete flows

#### `src/components/routes/ActiveWorkout/StopWorkoutDialog.tsx`

Confirmation dialog when user taps "Stop". Props:

```ts
type StopWorkoutDialogProps = {
  visible: boolean;
  completedSets: number;
  totalSets: number;
  onSaveAndStop: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};
```

Layout (Modal):
- Title: "Stop Workout?"
- Text: "You've completed X of Y sets."
- Three options:
  - "Save Progress" (secondary) — saves with status `"cancelled"`, preserving completed sets
  - "Discard" (destructive) — deletes the session entirely
  - "Keep Going" (ghost) — dismisses the dialog

#### `src/components/routes/ActiveWorkout/WorkoutSummary.tsx`

Summary screen shown after completing a workout. Props:

```ts
type WorkoutSummaryProps = {
  duration: number;          // seconds
  completedSets: number;
  totalSets: number;
  exercises: WorkoutExercise[];
  onDone: () => void;
};
```

Layout:
- Centered content with celebration feel
- Large checkmark icon in `accent` color
- "Workout Complete!" heading
- Stats row: duration (formatted), sets completed, completion percentage
- Exercise summary: each exercise with completed sets count
- "Done" `Button` (primary) — navigates back (dismisses the modal)

Complete workout flow:
1. All sets are completed → show a "Complete Workout" button in the header area (or auto-detect)
2. OR user manually triggers completion when satisfied
3. `PATCH /api/sessions/:id` with `status: "completed"`
4. Transition to `WorkoutSummary` view
5. "Done" dismisses the modal and returns to the routine

## Key Technical Decisions

1. **Full-screen modal** — the workout runs as a `fullScreenModal` presentation, covering the tab bar. This creates an immersive, focused experience and prevents accidental navigation away from an active workout.

2. **Pre-populated sets** — when a session starts, the API creates all set rows upfront based on the routine. This means the workout screen has all its data immediately and individual set updates are simple PATCH calls.

3. **Optimistic updates** — set completions update local state immediately and fire the API call in the background. This makes the UI feel instant. If the PATCH fails, the local state is the source of truth for the session (the user can retry).

4. **`target_reps` parsing** — the `reps` field in exercises is text (e.g., "8-12"), but `target_reps` in workout_sets needs to be an integer. The API takes the first number: "8-12" → 8, "10" → 10, "AMRAP" → 0 (treated as uncapped). The user can always override by entering their actual reps.

5. **Rest timer as overlay** — the timer appears as a semi-transparent overlay within the workout modal, not a separate screen. This lets the user still see their workout context while resting. The skip button is prominent because rest times are suggestions, not requirements.

6. **Haptic feedback** — tactile feedback on set completion and timer end makes the app feel responsive and physical, matching the workout context.

## Acceptance Criteria

- [ ] "Start Workout" on a routine day opens the full-screen workout modal
- [ ] Workout session is created with pre-populated sets from the routine
- [ ] Elapsed timer counts up from 0:00 in the header
- [ ] Progress bar updates as sets are completed
- [ ] Each exercise shows its sets with target reps and a reps input field
- [ ] Tapping the checkmark on a set marks it complete with haptic feedback
- [ ] Completed sets show visual distinction (filled checkmark, dimmed row)
- [ ] Completed sets can be toggled back to uncompleted
- [ ] Rest timer auto-starts after completing a set (if exercise has rest_seconds)
- [ ] Rest timer shows animated circular countdown
- [ ] "Skip" button dismisses the rest timer early
- [ ] Timer completion triggers haptic feedback and auto-dismisses
- [ ] "Stop" button opens confirmation dialog with Save/Discard/Keep Going options
- [ ] "Save Progress" saves partial workout and closes modal
- [ ] Completing all sets (or manually completing) shows the summary screen
- [ ] Summary screen shows duration, sets completed, and per-exercise breakdown
- [ ] "Done" on summary dismisses the modal and returns to the app
- [ ] Set updates persist to the database (PATCH calls succeed)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
