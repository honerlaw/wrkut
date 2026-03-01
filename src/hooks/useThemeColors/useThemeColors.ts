import { useTheme } from "@/src/components/ThemeProvider";

const LIGHT_COLORS = {
  background: "#ffffff",
  surface: "#f4f4f5",
  border: "#e4e4e7",
  muted: "#d4d4d8",
  textSecondary: "#71717a",
  textPrimary: "#18181b",
  accent: "#65a30d",
  accentPressed: "#4d7c0f",
  destructive: "#dc2626",
  warning: "#d97706",
};

const DARK_COLORS = {
  background: "#09090b",
  surface: "#18181b",
  border: "#27272a",
  muted: "#3f3f46",
  textSecondary: "#a1a1aa",
  textPrimary: "#f4f4f5",
  accent: "#84cc16",
  accentPressed: "#a3e635",
  destructive: "#ef4444",
  warning: "#f59e0b",
};

export function useThemeColors() {
  const { colorScheme } = useTheme();
  return colorScheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}
