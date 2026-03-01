import { Text, View } from "react-native";

import { Typography } from "@/src/components/ui/Typography";
import type { Exercise } from "@/src/types/routine";

type ExerciseRowProps = {
  exercise: Exercise;
  index: number;
};

export function ExerciseRow({ exercise, index }: ExerciseRowProps) {
  return (
    <View className="flex-row gap-3 py-2">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-accent">
        <Text className="text-xs font-bold text-background">{index + 1}</Text>
      </View>
      <View className="flex-1">
        <Typography variant="body">{exercise.name}</Typography>
        <View className="mt-0.5 flex-row items-center gap-3">
          <Typography variant="caption">
            {exercise.sets} × {exercise.reps}
          </Typography>
          {exercise.restSeconds ? (
            <Typography variant="caption">
              {exercise.restSeconds}s rest
            </Typography>
          ) : null}
        </View>
        {exercise.notes ? (
          <Typography variant="caption" className="mt-0.5 italic">
            {exercise.notes}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}
