import { Ionicons } from "@expo/vector-icons";
import type { UIMessage } from "ai";
import { useRef } from "react";
import { FlatList, View } from "react-native";

import { Typography } from "@/src/components/ui/Typography";

import { ChatBubble } from "./ChatBubble";

type ChatMessageListProps = {
  messages: UIMessage[];
  status: string;
  error?: string;
};

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatMessageList({
  messages,
  status,
  error,
}: ChatMessageListProps) {
  const listRef = useRef<FlatList>(null);

  const isStreaming = status === "streaming";

  // FlatList inverted renders from bottom, so reverse the data
  const reversed = [...messages].reverse();

  return (
    <FlatList
      ref={listRef}
      data={reversed}
      inverted
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      renderItem={({ item, index }) => {
        const text = getMessageText(item);
        const isLastAssistant =
          index === 0 && item.role === "assistant" && isStreaming;
        return (
          <ChatBubble
            role={item.role as "user" | "assistant"}
            content={text}
            isStreaming={isLastAssistant}
          />
        );
      }}
      ListHeaderComponent={
        error ? (
          <View className="my-2 flex-row items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3">
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Typography variant="caption" className="flex-1 text-destructive">
              {error}
            </Typography>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-20">
          <Typography variant="caption">
            Ask me to create a workout routine
          </Typography>
        </View>
      }
    />
  );
}
