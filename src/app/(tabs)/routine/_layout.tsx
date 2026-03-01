import { Stack } from "expo-router";

import { useThemeColors } from "@/src/hooks/useThemeColors";

export default function RoutineLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
