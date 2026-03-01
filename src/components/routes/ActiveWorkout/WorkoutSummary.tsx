import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";
import type { WorkoutExercise } from "@/src/types/workout";

type WorkoutSummaryProps = {
  duration: number;
  completedSets: number;
  totalSets: number;
  exercises: WorkoutExercise[];
  onDone: () => void;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function WorkoutSummary({
  duration,
  completedSets,
  totalSets,
  exercises,
  onDone,
}: WorkoutSummaryProps) {
  const percentage =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="checkmark-circle" size={80} color="#84cc16" />
      <Typography variant="h1" className="mt-4">
        Workout Complete!
      </Typography>

      <View className="mt-6 flex-row gap-6">
        <View className="items-center">
          <Typography variant="h2">{formatDuration(duration)}</Typography>
          <Typography variant="caption">Duration</Typography>
        </View>
        <View className="items-center">
          <Typography variant="h2">
            {completedSets}/{totalSets}
          </Typography>
          <Typography variant="caption">Sets</Typography>
        </View>
        <View className="items-center">
          <Typography variant="h2">{percentage}%</Typography>
          <Typography variant="caption">Complete</Typography>
        </View>
      </View>

      <View className="mt-8 w-full gap-2">
        {exercises.map((ex) => {
          const done = ex.sets.filter((s) => s.completed).length;
          return (
            <View
              key={ex.exerciseId}
              className="flex-row items-center justify-between rounded-xl bg-surface px-4 py-3"
            >
              <Typography variant="body">{ex.exerciseName}</Typography>
              <Typography variant="caption">
                {done}/{ex.sets.length} sets
              </Typography>
            </View>
          );
        })}
      </View>

      <View className="mt-8 w-full">
        <Button onPress={onDone}>Done</Button>
      </View>
    </View>
  );
}
