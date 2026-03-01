import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { useTheme } from "@/src/components/ThemeProvider";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function ThemeToggle() {
  const { colorScheme, toggleTheme } = useTheme();
  const colors = useThemeColors();

  return (
    <Pressable onPress={toggleTheme} className="p-2">
      <Ionicons
        name={colorScheme === "dark" ? "sunny-outline" : "moon-outline"}
        size={22}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}
