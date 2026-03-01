# Phase 5: Routine Display & Management

## Goal

Build the Routine tab to display, inspect, and manage workout routines created via the AI chat. After this phase, users can browse their routines, view full routine details with exercises, delete routines, and initiate workouts (the "Start Workout" button is wired up but the actual workout tracking is Phase 6).

## Dependencies

No new packages to install. All needed libraries are already available:

- `expo-router` — stack navigation for detail views
- UI components from Phase 1 (Button, Card, Typography, Badge)
- API client from Phase 3
- Routine types from Phase 3

## Files to Create / Modify

### Modified Files — Route Structure

The Routine tab needs a nested stack navigator to support the detail view. This requires converting the routine route from a single file to a route group.

#### Delete `src/app/(tabs)/routine.tsx`

Replace with the route group below.

#### `src/app/(tabs)/routine/_layout.tsx`

Stack navigator for the routine section:

```tsx
import { Stack } from "expo-router";

export default function RoutineLayout() {
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

#### `src/app/(tabs)/routine/index.tsx`

Thin wrapper:
```tsx
export { RoutineRoute as default } from "@/src/components/routes/Routine";
```

#### `src/app/(tabs)/routine/[id].tsx`

Thin wrapper for the routine detail screen:
```tsx
export { RoutineDetailRoute as default } from "@/src/components/routes/RoutineDetail";
```

### New / Modified Files — Components

#### `src/components/routes/Routine/RoutineRoute.tsx` (replace placeholder)

The main routine list screen. Layout:

- `SafeAreaView` with `flex-1 bg-background`
- Header: "Routines" title (`Typography variant="h1"`) with top padding
- Content: scrollable list of routine cards, or an empty state
- Pull-to-refresh via `RefreshControl`

State management:
- Fetch routines on mount via `GET /api/routines` using `useApiClient`
- Store in local state: `routines: Routine[]`, `isLoading: boolean`, `isRefreshing: boolean`
- Re-fetch on pull-to-refresh and when the screen comes into focus (use `useFocusEffect` from expo-router)

**Empty state** (when no routines exist):
- Centered content with an icon (e.g., `Ionicons` barbell icon in muted color)
- Text: "No routines yet"
- Subtext: "Chat with your AI trainer to create a personalized workout plan"
- `Button` (primary): "Go to Chat" — navigates to the Home tab via `router.push("/(tabs)/")`

**Routine cards** (when routines exist):
- Use `Card` component for each routine
- Card content:
  - Routine name (`Typography variant="h3"`)
  - Description truncated to 2 lines (`Typography variant="caption"`, `numberOfLines={2}`)
  - Frequency badge (`Badge variant="default"`) if frequency is set
  - Day count: "X days" (`Typography variant="caption"`)
- `onPress` navigates to `/routine/${routine.id}`
- Cards are rendered in a `ScrollView` (not FlatList — routine counts will be small)

#### `src/components/routes/RoutineDetail/index.tsx`

Re-export: `export { RoutineDetailRoute } from "./RoutineDetailRoute";`

#### `src/components/routes/RoutineDetail/RoutineDetailRoute.tsx`

Full routine detail screen showing days and exercises. Layout:

- `SafeAreaView` with `flex-1 bg-background`
- Header row: back button (left arrow icon), routine name, delete button (trash icon, red tint)
- `ScrollView` content with `RefreshControl`
- Routine metadata: description, frequency badge
- Day sections (collapsible)
- Loading state while fetching

State management:
- Get route param `id` via `useLocalSearchParams` from expo-router
- Fetch routine via `GET /api/routines/:id` using `useApiClient`
- Track `isLoading`, `isRefreshing`, `expandedDays: Set<string>` (which day sections are expanded)

#### `src/components/routes/RoutineDetail/DaySection.tsx`

A collapsible section for each routine day. Props:

```ts
type DaySectionProps = {
  day: RoutineDay;
  isExpanded: boolean;
  onToggle: () => void;
  onStartWorkout: () => void;
};
```

Layout:
- Header row (pressable to toggle):
  - Day label (`Typography variant="h3"`)
  - Exercise count badge (`Badge`): "X exercises"
  - Chevron icon that rotates based on expanded state (use `react-native-reanimated` for smooth rotation)
- When expanded:
  - List of `ExerciseRow` components
  - "Start Workout" `Button` (primary, full width) at the bottom of the section
- Separator line between sections

#### `src/components/routes/RoutineDetail/ExerciseRow.tsx`

Individual exercise display. Props:

```ts
type ExerciseRowProps = {
  exercise: Exercise;
  index: number;
};
```

Layout:
- Row with left-aligned content:
  - Exercise number (index + 1) in a small circle (`bg-accent text-background rounded-full w-6 h-6 items-center justify-center`)
  - Exercise name (`Typography variant="body"`)
- Below the name row:
  - Sets × Reps (`Typography variant="caption"`): e.g., "4 × 8-10"
  - Rest period (`Typography variant="caption"`): e.g., "90s rest" (if `restSeconds` is set)
  - Notes (`Typography variant="caption"`, italic) if present

#### `src/components/routes/RoutineDetail/DeleteRoutineDialog.tsx`

Confirmation dialog for routine deletion. Props:

```ts
type DeleteRoutineDialogProps = {
  visible: boolean;
  routineName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
};
```

Implementation:
- Use React Native `Modal` with transparent background and a dark overlay
- Centered card with:
  - Title: "Delete Routine"
  - Text: `Are you sure you want to delete "${routineName}"? This action cannot be undone.`
  - Two buttons: "Cancel" (ghost variant) and "Delete" (destructive variant)
  - "Delete" button shows loading state while `isDeleting` is true

Delete flow:
1. User taps trash icon in header → dialog opens
2. User taps "Delete" → `DELETE /api/routines/:id` is called
3. On success → navigate back to routine list
4. On error → show error message in dialog

#### "Start Workout" button behavior

In this phase, the "Start Workout" button shows an alert or toast saying "Workout tracking coming soon!" (Phase 6 will wire this up to the actual workout flow). Use a simple `Alert.alert()` for now.

## Key Technical Decisions

1. **Route group for nested navigation** — converting `routine.tsx` to a `routine/` folder with `_layout.tsx` enables stack navigation within the tab. This lets the detail view push on top of the list while keeping the tab bar visible.

2. **Collapsible day sections** — routines can have many days with many exercises. Collapsible sections keep the detail view manageable. All sections start collapsed; the user expands what they need.

3. **Pull-to-refresh + focus refetch** — data is refetched both on pull-to-refresh and when the screen regains focus (e.g., returning from another tab after accepting a plan). This ensures data is always fresh without complex state management.

4. **ScrollView over FlatList for routine list** — users will typically have 1-3 routines, so virtualization is unnecessary. ScrollView is simpler and avoids FlatList's nesting issues within tab navigators.

5. **Modal for delete confirmation** — a native-feeling pattern for destructive actions. The modal prevents accidental deletion and provides clear cancel/confirm options.

## Acceptance Criteria

- [ ] Routine tab shows a list of routine cards (fetched from API)
- [ ] Each card shows routine name, description preview, frequency badge, and day count
- [ ] Tapping a card navigates to the routine detail screen
- [ ] Detail screen shows routine name, description, and frequency
- [ ] Day sections are collapsible with smooth chevron animation
- [ ] Expanded day sections show exercises with sets, reps, rest, and notes
- [ ] Exercise rows have numbered indicators
- [ ] "Start Workout" button is present on each day section (shows "coming soon" alert for now)
- [ ] Delete button in header opens confirmation dialog
- [ ] Confirming deletion removes the routine and navigates back to the list
- [ ] Empty state shows when no routines exist with "Go to Chat" button
- [ ] Pull-to-refresh works on both the list and detail screens
- [ ] Data refreshes when navigating back to the routine tab
- [ ] Back button on detail screen returns to the routine list
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
