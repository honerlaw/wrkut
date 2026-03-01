import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { Badge } from "@/src/components/ui/Badge";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Typography } from "@/src/components/ui/Typography";
import { useApiClient } from "@/src/hooks/useApiClient";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import type { SessionDetail } from "@/src/types/session";
import { formatDuration } from "@/src/utils/formatDuration";

const STATUS_BADGE_VARIANT = {
  completed: "success",
  cancelled: "warning",
  in_progress: "default",
} as const;

export function SessionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const apiClient = useApiClient();
  const router = useRouter();
  const colors = useThemeColors();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!apiClient || !id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await apiClient.fetch<SessionDetail>(`/api/sessions/${id}`);
      setSession(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pb-2 pt-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View className="flex-1 px-2">
          <Typography variant="h2" className="text-center">
            Workout Details
          </Typography>
        </View>
        <View className="w-10" />
      </View>

      {isLoading ? (
        <View className="gap-4 px-6 pt-4">
          <View className="flex-row justify-around">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-20" />
          </View>
          {[1, 2].map((i) => (
            <View
              key={i}
              className="gap-2 rounded-2xl border border-border bg-surface p-4"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </View>
          ))}
        </View>
      ) : hasError ? (
        <ErrorState message="Failed to load session" onRetry={fetchSession} />
      ) : session ? (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="mt-4 flex-row items-center justify-between">
            <View>
              <Typography variant="h3">{session.routineName}</Typography>
              <Typography variant="caption">{session.dayLabel}</Typography>
            </View>
            <Badge variant={STATUS_BADGE_VARIANT[session.status]}>
              {session.status === "completed" ? "Completed" : "Cancelled"}
            </Badge>
          </View>

          <View className="mt-4 flex-row justify-around rounded-2xl border border-border bg-surface py-4">
            <View className="items-center">
              <Typography variant="h3">
                {session.durationSeconds != null
                  ? formatDuration(session.durationSeconds)
                  : "--"}
              </Typography>
              <Typography variant="caption">Duration</Typography>
            </View>
            <View className="items-center">
              <Typography variant="h3">
                {session.completedSets}/{session.totalSets}
              </Typography>
              <Typography variant="caption">Sets</Typography>
            </View>
            <View className="items-center">
              <Typography variant="h3">
                {session.totalSets > 0
                  ? Math.round(
                      (session.completedSets / session.totalSets) * 100,
                    )
                  : 0}
                %
              </Typography>
              <Typography variant="caption">Complete</Typography>
            </View>
          </View>

          <View className="mt-6 gap-4">
            {session.exercises.map((exercise, exerciseIndex) => (
              <View
                key={exerciseIndex}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <Typography variant="h3">{exercise.exerciseName}</Typography>

                <View className="mt-3 flex-row border-b border-border pb-2">
                  <Text className="w-10 text-center text-xs font-medium uppercase text-text-secondary">
                    Set
                  </Text>
                  <Text className="w-16 text-center text-xs font-medium uppercase text-text-secondary">
                    Target
                  </Text>
                  <Text className="flex-1 text-center text-xs font-medium uppercase text-text-secondary">
                    Actual
                  </Text>
                  <Text className="w-12 text-center text-xs font-medium uppercase text-text-secondary">
                    Status
                  </Text>
                </View>

                {exercise.sets.map((set) => {
                  let repsColor = "text-text-secondary";
                  if (set.completed && set.actualReps != null) {
                    repsColor =
                      set.actualReps >= set.targetReps
                        ? "text-accent"
                        : "text-warning";
                  }

                  return (
                    <View
                      key={set.setNumber}
                      className="flex-row items-center border-b border-border/30 py-2.5"
                    >
                      <Text className="w-10 text-center text-sm text-text-secondary">
                        {set.setNumber}
                      </Text>
                      <Text className="w-16 text-center text-sm text-text-primary">
                        {set.targetReps}
                      </Text>
                      <Text
                        className={`flex-1 text-center text-sm ${repsColor}`}
                      >
                        {set.actualReps ?? "--"}
                      </Text>
                      <View className="w-12 items-center">
                        {set.completed ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={colors.accent}
                          />
                        ) : (
                          <Ionicons
                            name="close-circle-outline"
                            size={18}
                            color={colors.muted}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {session.notes ? (
            <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <Typography variant="caption" className="mb-1 uppercase">
                Notes
              </Typography>
              <Typography variant="body" className="text-text-secondary">
                {session.notes}
              </Typography>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
