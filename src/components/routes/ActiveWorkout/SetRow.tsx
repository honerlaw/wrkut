import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import type { WorkoutSet } from "@/src/types/workout";

type SetRowProps = {
  set: WorkoutSet;
  onComplete: (actualReps: number) => void;
  onUncomplete: () => void;
};

export function SetRow({ set, onComplete, onUncomplete }: SetRowProps) {
  const [repsText, setRepsText] = useState(String(set.targetReps));

  const handleToggle = () => {
    if (set.completed) {
      onUncomplete();
    } else {
      const reps = parseInt(repsText, 10) || set.targetReps;
      onComplete(reps);
    }
  };

  return (
    <View
      className={`flex-row items-center border-b border-border py-3 ${set.completed ? "opacity-50" : ""}`}
    >
      <View className="w-10 items-center">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-muted">
          <Text className="text-xs font-bold text-text-primary">
            {set.setNumber}
          </Text>
        </View>
      </View>

      <View className="w-16 items-center">
        <Text className="text-sm text-text-secondary">{set.targetReps}</Text>
      </View>

      <View className="flex-1 items-center">
        <TextInput
          value={set.completed ? String(set.actualReps ?? repsText) : repsText}
          onChangeText={setRepsText}
          keyboardType="number-pad"
          editable={!set.completed}
          className="w-16 rounded-lg border border-border bg-background px-3 py-1.5 text-center text-text-primary"
          placeholderTextColor="#3f3f46"
        />
      </View>

      <View className="w-12 items-center">
        <Pressable onPress={handleToggle}>
          {set.completed ? (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
              <Ionicons name="checkmark" size={18} color="#09090b" />
            </View>
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-muted">
              <Ionicons name="checkmark" size={18} color="#3f3f46" />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
