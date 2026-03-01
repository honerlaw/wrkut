import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  View,
} from "react-native";

import { ErrorState } from "@/src/components/ui/ErrorState";
import { Typography } from "@/src/components/ui/Typography";
import { useUser } from "@/src/components/UserProvider";

import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

export function HomeRoute() {
  const { userId } = useUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: userId ? { "X-User-Id": userId } : {},
        body: { conversationId },
      }),
    [userId, conversationId],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
    onFinish: ({ messages: finishedMessages }) => {
      // Extract conversationId from the first response if not set
      if (!conversationIdRef.current && finishedMessages.length > 0) {
        // The conversation ID comes from the response header
        // We'll get it from the body parameter sent to the next request
      }
    },
  });

  const handleSend = useCallback(
    async (text: string) => {
      if (!userId) return;

      // Create conversation on first message
      if (!conversationIdRef.current) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": userId,
            },
          });
          const json = await res.json();
          if (json.success) {
            setConversationId(json.data.id);
            conversationIdRef.current = json.data.id;
          }
        } catch {
          // Continue without persistence
        }
      }

      sendMessage({ text });
    },
    [userId, sendMessage],
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    conversationIdRef.current = null;
  }, [setMessages]);

  const isResponding = status === "streaming" || status === "submitted";
  const hasError = status === "error" && error != null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
          <Typography variant="h2">Chat</Typography>
          <Pressable onPress={handleNewChat}>
            <Typography variant="caption" className="text-accent">
              New Chat
            </Typography>
          </Pressable>
        </View>

        <View className="flex-1">
          {hasError && messages.length === 0 ? (
            <ErrorState
              message="Unable to connect to chat"
              onRetry={() => handleNewChat()}
            />
          ) : (
            <ChatMessageList
              messages={messages}
              status={status}
              error={hasError ? error.message : undefined}
            />
          )}
        </View>

        <ChatInput onSend={handleSend} isDisabled={isResponding} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
