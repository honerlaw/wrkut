import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import type { RoutineDay } from "@/src/types/routine";

import { ExerciseRow } from "./ExerciseRow";

type DaySectionProps = {
  day: RoutineDay;
  isExpanded: boolean;
  onToggle: () => void;
  onStartWorkout: () => void;
};

export function DaySection({
  day,
  isExpanded,
  onToggle,
  onStartWorkout,
}: DaySectionProps) {
  const colors = useThemeColors();
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: withTiming(isExpanded ? "180deg" : "0deg", { duration: 200 }) },
    ],
  }));

  return (
    <View className="border-b border-border py-3">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Typography variant="h3">{day.dayLabel}</Typography>
          <Badge>
            {day.exercises.length} exercise
            {day.exercises.length !== 1 ? "s" : ""}
          </Badge>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <View className="mt-3">
          {day.exercises.map((exercise, i) => (
            <ExerciseRow key={exercise.id} exercise={exercise} index={i} />
          ))}
          <Button onPress={onStartWorkout} className="mt-3">
            Start Workout
          </Button>
        </View>
      )}
    </View>
  );
}
