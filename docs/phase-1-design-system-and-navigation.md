# Phase 1: Design System & App Navigation

## Goal

Establish the visual foundation and navigation structure for wrkut. After this phase, the app has a dark-first color palette, a 3-tab bottom navigation (Home, Routine, History), reusable UI primitives, and placeholder screens — all with zero backend dependencies.

## Dependencies

No new packages to install. Everything needed is already in the project:

- `nativewind` ^4.2.2 (Tailwind for RN)
- `tailwindcss` ^3.4.19
- `@react-navigation/bottom-tabs` ^7.4.0
- `expo-router` ~6.0.23
- `@expo/vector-icons` ^15.0.3
- `react-native-reanimated` ~4.1.1

## Color Palette

The app uses a dark-first design. Extend `tailwind.config.js` with these custom colors:

```
zinc-950  (#09090b)  — app background
zinc-900  (#18181b)  — card / surface background
zinc-800  (#27272a)  — borders, dividers
zinc-700  (#3f3f46)  — muted / disabled elements
zinc-400  (#a1a1aa)  — secondary text
zinc-100  (#f4f4f5)  — primary text
lime-500  (#84cc16)  — primary accent (buttons, active tab, highlights)
lime-400  (#a3e635)  — accent hover / pressed state
red-500   (#ef4444)  — destructive actions
amber-500 (#f59e0b)  — warnings, in-progress states
```

> These are standard Tailwind colors so they're already available — but we define semantic aliases in `tailwind.config.js` so the codebase uses consistent naming.

## Files to Create / Modify

### Modified Files

#### `tailwind.config.js`

Add semantic color aliases under `theme.extend.colors`:

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#09090b",      // zinc-950
        surface: "#18181b",          // zinc-900
        border: "#27272a",           // zinc-800
        muted: "#3f3f46",            // zinc-700
        "text-secondary": "#a1a1aa", // zinc-400
        "text-primary": "#f4f4f5",   // zinc-100
        accent: "#84cc16",           // lime-500
        "accent-pressed": "#a3e635", // lime-400
        destructive: "#ef4444",      // red-500
        warning: "#f59e0b",          // amber-500
      },
    },
  },
  plugins: [],
};
```

#### `src/app/_layout.tsx`

Replace the current root layout. Remove the `ThemeProvider` from `@react-navigation/native` (NativeWind handles theming). The root layout becomes a simple `Slot` that renders child routes and sets the background:

```tsx
import "./global.css";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <View className="flex-1 bg-background">
      <Slot />
      <StatusBar style="light" />
    </View>
  );
}
```

### New Files — Route Structure

#### `src/app/(tabs)/_layout.tsx`

Tab navigator layout with 3 tabs. Use `Tabs` from expo-router. Configure:

- **Tab bar style**: background `#09090b` (background color), no top border, absolute positioning for transparent feel
- **Tab icons**: Use `Ionicons` from `@expo/vector-icons`
  - Home tab: `chatbubble-ellipses-outline` / `chatbubble-ellipses` (active)
  - Routine tab: `barbell-outline` / `barbell` (active)
  - History tab: `time-outline` / `time` (active)
- **Active tint**: `#84cc16` (accent/lime-500)
- **Inactive tint**: `#3f3f46` (muted/zinc-700)
- **Screen options**: `headerShown: false` on all screens (each screen manages its own header area)
- **Tab labels**: "Home", "Routine", "History"

```
src/app/(tabs)/_layout.tsx
```

#### `src/app/(tabs)/index.tsx`

Thin wrapper — exports `HomeRoute` from `@/src/components/routes/Home`.

```tsx
export { HomeRoute as default } from "@/src/components/routes/Home";
```

#### `src/app/(tabs)/routine.tsx`

Thin wrapper — exports `RoutineRoute` from `@/src/components/routes/Routine`.

```tsx
export { RoutineRoute as default } from "@/src/components/routes/Routine";
```

#### `src/app/(tabs)/history.tsx`

Thin wrapper — exports `HistoryRoute` from `@/src/components/routes/History`.

```tsx
export { HistoryRoute as default } from "@/src/components/routes/History";
```

### Delete Old Route

#### Delete `src/app/index.tsx`

The old landing page route is replaced by `(tabs)/index.tsx`. Delete this file.

#### Delete `src/components/routes/Landing/` (entire directory)

No longer needed — the landing route is replaced by the Home tab.

### New Files — Route Components

#### `src/components/routes/Home/index.tsx`

Re-export: `export { HomeRoute } from "./HomeRoute";`

#### `src/components/routes/Home/HomeRoute.tsx`

Placeholder screen for the Home/Chat tab. Layout:

- `SafeAreaView` with `className="flex-1 bg-background"`
- Header area: `Text` with "Home" in `text-text-primary text-2xl font-bold`, padded
- Center content: placeholder `Text` saying "AI Chat coming soon" in `text-text-secondary`

#### `src/components/routes/Routine/index.tsx`

Re-export: `export { RoutineRoute } from "./RoutineRoute";`

#### `src/components/routes/Routine/RoutineRoute.tsx`

Placeholder screen for the Routine tab. Same pattern as Home but says "Routines" / "Your workout routines will appear here".

#### `src/components/routes/History/index.tsx`

Re-export: `export { HistoryRoute } from "./HistoryRoute";`

#### `src/components/routes/History/HistoryRoute.tsx`

Placeholder screen for the History tab. Same pattern but says "History" / "Your workout history will appear here".

### New Files — UI Primitives

All UI components follow the CLAUDE.md convention: folder named after the component, with `index.tsx` re-exporting and `ComponentName.tsx` containing the implementation.

#### `src/components/ui/Typography/index.tsx`

Re-export: `export { Typography } from "./Typography";`

#### `src/components/ui/Typography/Typography.tsx`

A flexible text component. Props:

```ts
type TypographyVariant = "h1" | "h2" | "h3" | "body" | "caption" | "label";

type TypographyProps = {
  variant?: TypographyVariant;  // default: "body"
  className?: string;           // additional classes merged
  children: React.ReactNode;
};
```

Variant class mappings:
- `h1`: `text-3xl font-bold text-text-primary`
- `h2`: `text-2xl font-bold text-text-primary`
- `h3`: `text-xl font-semibold text-text-primary`
- `body`: `text-base text-text-primary`
- `caption`: `text-sm text-text-secondary`
- `label`: `text-xs font-medium uppercase tracking-wider text-text-secondary`

Renders a `Text` component. The `className` prop is merged after variant classes so consumers can override.

#### `src/components/ui/Button/index.tsx`

Re-export: `export { Button } from "./Button";`

#### `src/components/ui/Button/Button.tsx`

A pressable button component. Props:

```ts
type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;   // default: "primary"
  size?: ButtonSize;         // default: "md"
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  children: React.ReactNode;
};
```

Uses `Pressable` from React Native. Variant styles:

- `primary`: `bg-accent` background, `text-background` text (dark text on lime). Pressed: `bg-accent-pressed`
- `secondary`: `bg-surface border border-border` background, `text-text-primary` text. Pressed: `bg-zinc-800`
- `destructive`: `bg-destructive` background, `text-white` text. Pressed: `bg-red-600`
- `ghost`: transparent background, `text-text-secondary` text. Pressed: `bg-surface`

Size padding:
- `sm`: `px-3 py-1.5`, text `text-sm`
- `md`: `px-4 py-2.5`, text `text-base`
- `lg`: `px-6 py-3.5`, text `text-lg`

All variants: `rounded-xl items-center justify-center` base classes. Disabled: `opacity-50` and `onPress` is ignored.

Text inside the button is rendered with a `Text` component (not `Typography` to avoid coupling).

#### `src/components/ui/Card/index.tsx`

Re-export: `export { Card } from "./Card";`

#### `src/components/ui/Card/Card.tsx`

A container card. Props:

```ts
type CardProps = {
  className?: string;
  children: React.ReactNode;
  onPress?: () => void;   // if provided, wraps in Pressable
};
```

Base classes: `bg-surface rounded-2xl border border-border p-4`

If `onPress` is provided, render as `Pressable` with pressed state `bg-zinc-800`. Otherwise render as `View`.

#### `src/components/ui/Input/index.tsx`

Re-export: `export { Input } from "./Input";`

#### `src/components/ui/Input/Input.tsx`

A text input component. Props:

```ts
type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
};
```

Uses `TextInput` from React Native. Styles:

- Container: `bg-surface border border-border rounded-xl px-4 py-3`
- Text color: `text-text-primary`
- Placeholder color: set via `placeholderTextColor` prop to `#3f3f46` (muted)
- Focus state: use `onFocus`/`onBlur` to toggle `border-accent` class

#### `src/components/ui/Badge/index.tsx`

Re-export: `export { Badge } from "./Badge";`

#### `src/components/ui/Badge/Badge.tsx`

A small label badge. Props:

```ts
type BadgeVariant = "default" | "success" | "warning" | "destructive";

type BadgeProps = {
  variant?: BadgeVariant;  // default: "default"
  className?: string;
  children: React.ReactNode;
};
```

Variant styles:
- `default`: `bg-surface border border-border`, `text-text-secondary` text
- `success`: `bg-lime-500/20`, `text-accent` text
- `warning`: `bg-amber-500/20`, `text-warning` text
- `destructive`: `bg-red-500/20`, `text-destructive` text

Base: `rounded-full px-2.5 py-0.5 self-start`. Text: `text-xs font-medium`.

## Key Technical Decisions

1. **Semantic color aliases** rather than raw Tailwind colors — makes future palette changes a single-file edit.
2. **`Slot` instead of `Stack` at root** — the tab navigator is the primary navigation; we don't need a stack at root level yet. When full-screen overlays are needed (Phase 6), we'll add a modal stack.
3. **No `ThemeProvider`** — NativeWind handles all theming through Tailwind classes. We hardcode `StatusBar style="light"` since the app is dark-first.
4. **Pressable over TouchableOpacity** — `Pressable` is the modern React Native approach with better customization of pressed/hover states.
5. **`className` merge pattern** — all UI components accept a `className` prop that is appended after default classes, letting consumers override without wrapper Views.

## Acceptance Criteria

- [ ] `tailwind.config.js` has semantic color aliases (background, surface, accent, etc.)
- [ ] App launches with a bottom tab bar containing Home, Routine, and History tabs
- [ ] Tab bar has dark background, lime-500 active tint, zinc-700 inactive tint
- [ ] Tapping each tab navigates to its placeholder screen
- [ ] Each placeholder screen shows the tab name and a descriptive message
- [ ] `Button` component renders all 4 variants (primary, secondary, destructive, ghost) and 3 sizes
- [ ] `Card` component renders with surface background and border; supports onPress
- [ ] `Typography` component renders all 6 variants with correct sizing and color
- [ ] `Input` component shows placeholder, accepts text, highlights border on focus
- [ ] `Badge` component renders all 4 variants with correct colors
- [ ] No `StyleSheet.create()` or inline `style` objects anywhere — all NativeWind
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build:web` succeeds
