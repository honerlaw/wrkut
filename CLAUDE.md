# CLAUDE.md — wrkut

## Tech Stack

- **Expo** v54, **React Native** 0.81, **React** 19
- **expo-router** v6 (file-based routing)
- **NativeWind** v4 (Tailwind CSS for React Native)
- **TypeScript** strict mode
- **ESLint** via expo-lint
- **Prettier** with `prettier-plugin-tailwindcss`

## Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Start on iOS
npm run android        # Start on Android
npm run web            # Start on web
npm run lint           # Run ESLint
npm run format         # Check formatting (Prettier)
npm run format:fix     # Fix formatting (Prettier)
npm run typecheck      # Run TypeScript type checking
npm run build:web      # Export web build
```

## Pre-commit Checklist

```bash
npm run lint && npm run format && npm run typecheck && npm run build:web
```

## Project Structure

```
src/
  app/                    # expo-router routes (thin wrappers only)
    _layout.tsx           # Exception: layout logic stays here
    index.tsx             # Imports from components/routes/Landing
    global.css
  components/
    routes/               # Route page components (full implementations)
      Landing/
        index.tsx
        LandingRoute.tsx
    ui/                   # Reusable component library
      Button/
        index.tsx
        Button.tsx
        hooks/
          useButtonAnimation.ts
    SomeWidget/           # Non-reusable feature components
      index.tsx
      SomeWidget.tsx
  hooks/                  # Shared/reusable hooks
    useAuth/
      index.ts
      useAuth.ts
  utils/                  # Shared utility functions
    formatDate.ts         # Simple: no folder needed
    formatDuration/       # Complex: folder with helpers
      index.ts
      formatDuration.ts
      parseTokens.ts
  types/                  # Shared type definitions
  constants/              # Shared constants
```

## Route File Convention

- Files in `src/app/` are **thin wrappers**: `export { LandingRoute as default } from "@/src/components/routes/Landing"`
- `_layout.tsx` files are the **exception** — layout/provider logic stays in `src/app/`

## Styling Rules

- All styling via NativeWind `className` prop
- No `StyleSheet.create()` or inline `style` objects

## TypeScript Conventions

- Use `type` over `interface`
- No `any`; use `unknown` and narrow

## File & Module Conventions

- One exported function/component per file
- When helpers are needed: create a folder named after the export, place helpers in separate files, re-export the public function from `index.ts`/`index.tsx`

## Component Hooks

- **Component-specific hooks** go in a `hooks/` folder within the component directory
- **Shared hooks** go in `src/hooks/` following the same folder convention

## Naming Conventions

- Components / types: **PascalCase**
- Hooks: **camelCase** with `use` prefix
- Utils / constants files: **camelCase**
- Exported constants: **UPPER_SNAKE_CASE**
