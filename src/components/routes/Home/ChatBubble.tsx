import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { useApiClient } from "@/src/hooks/useApiClient";
import type { CreateRoutineInput } from "@/src/types/routine";

import { WorkoutPlanCard } from "./WorkoutPlanCard";

type ChatBubbleProps = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

function parseWorkoutPlans(content: string) {
  const parts: { type: "text" | "plan"; value: string }[] = [];
  const regex = /<workout-plan>([\s\S]*?)<\/workout-plan>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "plan", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts;
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  const isUser = role === "user";
  const apiClient = useApiClient();
  const router = useRouter();
  const [acceptedPlans, setAcceptedPlans] = useState<Set<number>>(new Set());

  const handleAcceptPlan = useCallback(
    async (plan: CreateRoutineInput, index: number) => {
      if (!apiClient) return;
      await apiClient.fetch("/api/routines", {
        method: "POST",
        body: plan,
      });
      setAcceptedPlans((prev) => new Set(prev).add(index));
      router.navigate("/(tabs)/routine" as never);
    },
    [apiClient, router],
  );

  const parts = isUser
    ? [{ type: "text" as const, value: content }]
    : parseWorkoutPlans(content);

  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      {parts.map((part, i) => {
        if (part.type === "plan") {
          try {
            const plan = JSON.parse(part.value) as CreateRoutineInput;
            return (
              <View key={i} className="max-w-[85%]">
                <WorkoutPlanCard
                  plan={plan}
                  onAccept={() => handleAcceptPlan(plan, i)}
                  accepted={acceptedPlans.has(i)}
                />
              </View>
            );
          } catch {
            // Invalid JSON — render as plain text
            return (
              <View
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-accent" : "bg-surface"}`}
              >
                <Text
                  className={isUser ? "text-background" : "text-text-primary"}
                >
                  {part.value}
                </Text>
              </View>
            );
          }
        }

        const trimmed = part.value.trim();
        if (!trimmed) return null;

        return (
          <View
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-accent" : "bg-surface"}`}
          >
            <Text className={isUser ? "text-background" : "text-text-primary"}>
              {trimmed}
              {isStreaming && i === parts.length - 1 && (
                <Text className="text-text-secondary"> ...</Text>
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
