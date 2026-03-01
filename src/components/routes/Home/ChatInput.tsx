import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { Input } from "@/src/components/ui/Input";
import { useThemeColors } from "@/src/hooks/useThemeColors";

import { useVoiceInput } from "./hooks/useVoiceInput";

type ChatInputProps = {
  onSend: (text: string) => void;
  isDisabled: boolean;
};

export function ChatInput({ onSend, isDisabled }: ChatInputProps) {
  const colors = useThemeColors();
  const [text, setText] = useState("");
  const {
    isListening,
    isAvailable,
    startListening,
    stopListening,
    transcript,
  } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      setText((prev) => prev + transcript);
    }
  }, [transcript]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setText("");
  }, [text, isDisabled, onSend]);

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const canSend = text.trim().length > 0 && !isDisabled;

  return (
    <View className="flex-row items-end gap-2 border-t border-border bg-surface px-4 py-3">
      {isAvailable && (
        <Pressable
          onPress={handleMicPress}
          className={`items-center justify-center rounded-full p-2 ${isListening ? "bg-accent" : ""}`}
        >
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={24}
            color={isListening ? colors.background : colors.textSecondary}
          />
        </Pressable>
      )}

      <View className="min-h-[44px] flex-1">
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Ask about workouts..."
          multiline
        />
      </View>

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className={`items-center justify-center rounded-full p-2 ${canSend ? "bg-accent" : "opacity-30"}`}
      >
        <Ionicons
          name="arrow-up"
          size={24}
          color={canSend ? colors.background : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}
