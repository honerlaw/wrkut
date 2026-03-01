import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";
import { useThemeColors } from "@/src/hooks/useThemeColors";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={colors.destructive}
      />
      <Typography variant="body" className="text-center text-text-secondary">
        {message}
      </Typography>
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry} size="sm">
          Try Again
        </Button>
      ) : null}
    </View>
  );
}
