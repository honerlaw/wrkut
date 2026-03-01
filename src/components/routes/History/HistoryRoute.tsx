import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, SafeAreaView, ScrollView, View } from "react-native";

import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Typography } from "@/src/components/ui/Typography";
import { useApiClient } from "@/src/hooks/useApiClient";
import type { WorkoutSession } from "@/src/types/session";
import { formatDuration } from "@/src/utils/formatDuration";
import { groupByDate } from "@/src/utils/groupByDate";

const PAGE_SIZE = 20;

const STATUS_BADGE_VARIANT = {
  completed: "success",
  cancelled: "warning",
  in_progress: "default",
} as const;

export function HistoryRoute() {
  const apiClient = useApiClient();
  const router = useRouter();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchSessions = useCallback(
    async (offset = 0) => {
      if (!apiClient) return [];
      const data = await apiClient.fetch<WorkoutSession[]>(
        `/api/sessions?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      return data;
    },
    [apiClient],
  );

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setHasError(false);
      fetchSessions(0)
        .then((data) => {
          setSessions(data);
          setHasMore(data.length >= PAGE_SIZE);
        })
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    }, [fetchSessions]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasError(false);
    try {
      const data = await fetchSessions(0);
      setSessions(data);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSessions]);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const data = await fetchSessions(sessions.length);
      setSessions((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      // Silently fail on load more
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchSessions, sessions.length]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    fetchSessions(0)
      .then((data) => {
        setSessions(data);
        setHasMore(data.length >= PAGE_SIZE);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [fetchSessions]);

  const isEmpty = !isLoading && !hasError && sessions.length === 0;
  const grouped = groupByDate(sessions, (s) => s.startedAt);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pb-2 pt-4">
        <Typography variant="h1">History</Typography>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={
          isEmpty || hasError || isLoading
            ? { flex: 1 }
            : { paddingBottom: 100 }
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#84cc16"
          />
        }
      >
        {isLoading ? (
          <View className="gap-3 pt-4">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="gap-2 rounded-2xl border border-border bg-surface p-4"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <View className="flex-row gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </View>
              </View>
            ))}
          </View>
        ) : hasError ? (
          <ErrorState
            message="Failed to load workout history"
            onRetry={handleRetry}
          />
        ) : isEmpty ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Ionicons name="time-outline" size={48} color="#3f3f46" />
            <Typography variant="h3" className="text-text-secondary">
              No workouts yet
            </Typography>
            <Typography variant="caption" className="text-center">
              Complete a workout to see it here
            </Typography>
            <Button
              onPress={() => router.navigate("/(tabs)/routine" as never)}
              className="mt-2"
            >
              Go to Routines
            </Button>
          </View>
        ) : (
          <View className="gap-4 pt-2">
            {grouped.map((group) => (
              <View key={group.title}>
                <Typography
                  variant="caption"
                  className="mb-2 uppercase text-text-secondary"
                >
                  {group.title}
                </Typography>
                <View className="gap-3">
                  {group.data.map((session) => (
                    <Card
                      key={session.id}
                      onPress={() =>
                        router.push(`/(tabs)/history/${session.id}` as never)
                      }
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Typography variant="h3">
                            {session.routineName}
                          </Typography>
                          <Typography variant="caption" className="mt-0.5">
                            {session.dayLabel}
                          </Typography>
                        </View>
                        <Badge variant={STATUS_BADGE_VARIANT[session.status]}>
                          {session.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                        </Badge>
                      </View>
                      <View className="mt-2 flex-row gap-4">
                        {session.durationSeconds != null ? (
                          <Typography variant="caption">
                            {formatDuration(session.durationSeconds)}
                          </Typography>
                        ) : null}
                        <Typography variant="caption">
                          {session.completedSets}/{session.totalSets} sets
                        </Typography>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            ))}

            {hasMore ? (
              <Button
                variant="ghost"
                onPress={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
