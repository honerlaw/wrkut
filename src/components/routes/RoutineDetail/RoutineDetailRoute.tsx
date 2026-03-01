import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";

import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Typography } from "@/src/components/ui/Typography";
import { useApiClient } from "@/src/hooks/useApiClient";
import type { Routine } from "@/src/types/routine";

import { DaySection } from "./DaySection";
import { DeleteRoutineDialog } from "./DeleteRoutineDialog";

export function RoutineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const apiClient = useApiClient();
  const router = useRouter();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoutine = useCallback(async () => {
    if (!apiClient || !id) return;
    const data = await apiClient.fetch<Routine>(`/api/routines/${id}`);
    setRoutine(data);
  }, [apiClient, id]);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    fetchRoutine()
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [fetchRoutine]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasError(false);
    try {
      await fetchRoutine();
    } catch {
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRoutine]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    fetchRoutine()
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [fetchRoutine]);

  const toggleDay = useCallback((dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!apiClient || !id) return;
    setIsDeleting(true);
    try {
      await apiClient.fetch(`/api/routines/${id}`, { method: "DELETE" });
      setShowDelete(false);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to delete routine");
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, id, router]);

  const handleStartWorkout = useCallback(
    (dayId: string) => {
      router.push({
        pathname: "/workout",
        params: { routineId: id, routineDayId: dayId },
      } as never);
    },
    [id, router],
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pb-2 pt-4">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#f4f4f5" />
          </Pressable>
          <View className="flex-1 px-2">
            <Skeleton className="mx-auto h-6 w-40" />
          </View>
          <View className="w-10" />
        </View>
        <View className="gap-4 px-6 pt-4">
          <Skeleton className="h-4 w-64" />
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className="gap-2 rounded-2xl border border-border bg-surface p-4"
            >
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pb-2 pt-4">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#f4f4f5" />
          </Pressable>
        </View>
        <ErrorState message="Failed to load routine" onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  if (!routine) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pb-2 pt-4">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#f4f4f5" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          <Ionicons name="alert-circle-outline" size={48} color="#3f3f46" />
          <Typography variant="body" className="text-text-secondary">
            Routine not found
          </Typography>
          <Button variant="secondary" onPress={() => router.back()} size="sm">
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#f4f4f5" />
        </Pressable>
        <View className="flex-1 px-2">
          <Typography variant="h2" className="text-center">
            {routine.name}
          </Typography>
        </View>
        <Pressable onPress={() => setShowDelete(true)} className="p-2">
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#84cc16"
          />
        }
      >
        {routine.description ? (
          <Typography variant="body" className="mt-2 text-text-secondary">
            {routine.description}
          </Typography>
        ) : null}

        {routine.frequency ? (
          <View className="mt-2">
            <Badge>{routine.frequency}</Badge>
          </View>
        ) : null}

        <View className="mt-4">
          {routine.days.map((day) => (
            <DaySection
              key={day.id}
              day={day}
              isExpanded={expandedDays.has(day.id)}
              onToggle={() => toggleDay(day.id)}
              onStartWorkout={() => handleStartWorkout(day.id)}
            />
          ))}
        </View>
      </ScrollView>

      <DeleteRoutineDialog
        visible={showDelete}
        routineName={routine.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isDeleting={isDeleting}
      />
    </SafeAreaView>
  );
}
