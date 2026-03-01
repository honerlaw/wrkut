import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView } from "react-native";

import { Typography } from "@/src/components/ui/Typography";

import { ExerciseBlock } from "./ExerciseBlock";
import { useWorkoutSession } from "./hooks/useWorkoutSession";
import { RestTimer } from "./RestTimer";
import { StopWorkoutDialog } from "./StopWorkoutDialog";
import { WorkoutHeader } from "./WorkoutHeader";
import { WorkoutSummary } from "./WorkoutSummary";

export function ActiveWorkoutRoute() {
  const { routineId, routineDayId } = useLocalSearchParams<{
    routineId: string;
    routineDayId: string;
  }>();
  const router = useRouter();

  const {
    exercises,
    isLoading,
    elapsedSeconds,
    completedSets,
    totalSets,
    activeRestTimer,
    completeSet,
    uncompleteSet,
    dismissRestTimer,
    stopWorkout,
    completeWorkout,
  } = useWorkoutSession({
    routineId: routineId ?? "",
    routineDayId: routineDayId ?? "",
  });

  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleStop = useCallback(() => {
    setShowStopDialog(true);
  }, []);

  const handleSaveAndStop = useCallback(async () => {
    await stopWorkout();
    setShowStopDialog(false);
  }, [stopWorkout]);

  const handleDiscard = useCallback(async () => {
    await stopWorkout();
    setShowStopDialog(false);
  }, [stopWorkout]);

  const handleComplete = useCallback(async () => {
    await completeWorkout();
    setIsComplete(true);
  }, [completeWorkout]);

  const allSetsCompleted = totalSets > 0 && completedSets === totalSets;

  // Auto-detect completion
  if (allSetsCompleted && !isComplete && !isLoading) {
    handleComplete();
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#84cc16" />
        <Typography variant="caption" className="mt-4">
          Starting workout...
        </Typography>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <WorkoutSummary
          duration={elapsedSeconds}
          completedSets={completedSets}
          totalSets={totalSets}
          exercises={exercises}
          onDone={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <WorkoutHeader
        elapsedSeconds={elapsedSeconds}
        completedSets={completedSets}
        totalSets={totalSets}
        onStop={handleStop}
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.exerciseId}
            exercise={exercise}
            onCompleteSet={completeSet}
            onUncompleteSet={uncompleteSet}
          />
        ))}
      </ScrollView>

      {activeRestTimer && (
        <RestTimer
          duration={activeRestTimer.duration}
          onComplete={dismissRestTimer}
          onSkip={dismissRestTimer}
        />
      )}

      <StopWorkoutDialog
        visible={showStopDialog}
        completedSets={completedSets}
        totalSets={totalSets}
        onSaveAndStop={handleSaveAndStop}
        onDiscard={handleDiscard}
        onCancel={() => setShowStopDialog(false)}
      />
    </SafeAreaView>
  );
}
