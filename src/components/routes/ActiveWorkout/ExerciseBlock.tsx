import { Text, View } from "react-native";

import { Typography } from "@/src/components/ui/Typography";
import type { WorkoutExercise } from "@/src/types/workout";

import { SetRow } from "./SetRow";

type ExerciseBlockProps = {
  exercise: WorkoutExercise;
  onCompleteSet: (setId: string, actualReps: number) => void;
  onUncompleteSet: (setId: string) => void;
};

export function ExerciseBlock({
  exercise,
  onCompleteSet,
  onUncompleteSet,
}: ExerciseBlockProps) {
  return (
    <View className="mb-6 rounded-2xl border border-border bg-surface p-4">
      <Typography variant="h3">{exercise.exerciseName}</Typography>
      {exercise.restSeconds ? (
        <Typography variant="caption" className="mt-1">
          {exercise.restSeconds}s rest between sets
        </Typography>
      ) : null}

      <View className="mt-3 flex-row border-b border-border pb-2">
        <Text className="w-10 text-center text-xs font-medium uppercase text-text-secondary">
          Set
        </Text>
        <Text className="w-16 text-center text-xs font-medium uppercase text-text-secondary">
          Target
        </Text>
        <Text className="flex-1 text-center text-xs font-medium uppercase text-text-secondary">
          Reps
        </Text>
        <Text className="w-12 text-center text-xs font-medium uppercase text-text-secondary" />
      </View>

      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          onComplete={(reps) => onCompleteSet(set.id, reps)}
          onUncomplete={() => onUncompleteSet(set.id)}
        />
      ))}
    </View>
  );
}
