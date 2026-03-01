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
import { useThemeColors } from "@/src/hooks/useThemeColors";
import type { Routine } from "@/src/types/routine";

export function RoutineRoute() {
  const apiClient = useApiClient();
  const router = useRouter();
  const colors = useThemeColors();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchRoutines = useCallback(async () => {
    if (!apiClient) return;
    const data = await apiClient.fetch<Routine[]>("/api/routines");
    setRoutines(data);
  }, [apiClient]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setHasError(false);
      fetchRoutines()
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    }, [fetchRoutines]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasError(false);
    try {
      await fetchRoutines();
    } catch {
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRoutines]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    fetchRoutines()
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [fetchRoutines]);

  const isEmpty = !isLoading && !hasError && routines.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pb-2 pt-4">
        <Typography variant="h1">Routines</Typography>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={
          isEmpty || hasError ? { flex: 1 } : { paddingBottom: 100 }
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {isLoading ? (
          <View className="gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="gap-2 rounded-2xl border border-border bg-surface p-4"
              >
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <View className="flex-row gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </View>
              </View>
            ))}
          </View>
        ) : hasError ? (
          <ErrorState message="Failed to load routines" onRetry={handleRetry} />
        ) : isEmpty ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Ionicons name="barbell-outline" size={48} color={colors.muted} />
            <Typography variant="h3" className="text-text-secondary">
              No routines yet
            </Typography>
            <Typography variant="caption" className="text-center">
              Chat with your AI trainer to create a personalized workout plan
            </Typography>
            <Button
              onPress={() => router.navigate("/(tabs)/" as never)}
              className="mt-2"
            >
              Go to Chat
            </Button>
          </View>
        ) : (
          <View className="gap-3">
            {routines.map((routine) => (
              <Card
                key={routine.id}
                onPress={() =>
                  router.push(`/(tabs)/routine/${routine.id}` as never)
                }
              >
                <Typography variant="h3">{routine.name}</Typography>
                {routine.description ? (
                  <Typography variant="caption" className="mt-1">
                    {routine.description}
                  </Typography>
                ) : null}
                <View className="mt-2 flex-row items-center gap-2">
                  {routine.frequency ? (
                    <Badge>{routine.frequency}</Badge>
                  ) : null}
                  <Typography variant="caption">
                    {routine.days.length} day
                    {routine.days.length !== 1 ? "s" : ""}
                  </Typography>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
