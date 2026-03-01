import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApiClient } from "@/src/hooks/useApiClient";
import type { WorkoutExercise, WorkoutSession } from "@/src/types/workout";

type UseWorkoutSessionOptions = {
  routineId: string;
  routineDayId: string;
};

export function useWorkoutSession({
  routineId,
  routineDayId,
}: UseWorkoutSessionOptions) {
  const apiClient = useApiClient();
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState<{
    duration: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Create session on mount
  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .fetch<WorkoutSession>("/api/sessions", {
        method: "POST",
        body: { routineId, routineDayId },
      })
      .then((data) => {
        setSession(data);
        setExercises(data.exercises);
      })
      .catch(() => {
        // Failed to create session
      })
      .finally(() => setIsLoading(false));
  }, [apiClient, routineId, routineDayId]);

  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const completeSet = useCallback(
    (setId: string, actualReps: number) => {
      setExercises((prev) => {
        let restSeconds: number | null = null;
        const updated = prev.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id === setId) {
              restSeconds = ex.restSeconds;
              return { ...s, actualReps, completed: true };
            }
            return s;
          }),
        }));

        if (restSeconds && restSeconds > 0) {
          setActiveRestTimer({ duration: restSeconds });
        }

        return updated;
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (session && apiClient) {
        apiClient
          .fetch(`/api/sessions/${session.id}/sets/${setId}`, {
            method: "PATCH",
            body: { actualReps, completed: true },
          })
          .catch(() => {});
      }
    },
    [session, apiClient],
  );

  const uncompleteSet = useCallback(
    (setId: string) => {
      setExercises((prev) =>
        prev.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) =>
            s.id === setId ? { ...s, actualReps: null, completed: false } : s,
          ),
        })),
      );

      if (session && apiClient) {
        apiClient
          .fetch(`/api/sessions/${session.id}/sets/${setId}`, {
            method: "PATCH",
            body: { actualReps: null, completed: false },
          })
          .catch(() => {});
      }
    },
    [session, apiClient],
  );

  const dismissRestTimer = useCallback(() => {
    setActiveRestTimer(null);
  }, []);

  const stopWorkout = useCallback(async () => {
    if (!session || !apiClient) return;
    await apiClient.fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      body: { status: "cancelled" },
    });
    router.back();
  }, [session, apiClient, router]);

  const completeWorkout = useCallback(async () => {
    if (!session || !apiClient) return;
    await apiClient.fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      body: { status: "completed" },
    });
  }, [session, apiClient]);

  return {
    session,
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
  };
}
