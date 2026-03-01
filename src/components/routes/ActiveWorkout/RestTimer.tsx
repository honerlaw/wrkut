import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";

type RestTimerProps = {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
};

export function RestTimer({ duration, onComplete, onSkip }: RestTimerProps) {
  const progress = useSharedValue(1);
  const remaining = useSharedValue(duration);

  useEffect(() => {
    progress.value = withTiming(0, {
      duration: duration * 1000,
      easing: Easing.linear,
    });

    const interval = setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0) {
        clearInterval(interval);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onComplete, 500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onComplete, progress, remaining]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const displayTime = Math.max(0, Math.ceil(remaining.value));
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const timeText =
    minutes > 0
      ? `${minutes}:${String(seconds).padStart(2, "0")}`
      : `${seconds}`;

  const isWarning = displayTime <= duration * 0.25;

  return (
    <Pressable
      onPress={onSkip}
      className="absolute inset-0 items-center justify-center bg-black/70"
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        className="items-center gap-6"
      >
        <Typography variant="caption">Rest Timer</Typography>

        <View className="h-40 w-40 items-center justify-center rounded-full border-4 border-surface">
          <Typography
            variant="h1"
            className={isWarning ? "text-destructive" : "text-accent"}
          >
            {timeText}
          </Typography>
        </View>

        <View className="h-2 w-48 overflow-hidden rounded-full bg-muted">
          <Animated.View
            className={`h-2 rounded-full ${isWarning ? "bg-destructive" : "bg-accent"}`}
            style={barStyle}
          />
        </View>

        <Button variant="ghost" onPress={onSkip}>
          Skip
        </Button>
      </Pressable>
    </Pressable>
  );
}
