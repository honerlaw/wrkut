import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/ui/Typography";

type WorkoutHeaderProps = {
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  onStop: () => void;
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function WorkoutHeader({
  elapsedSeconds,
  completedSets,
  totalSets,
  onStop,
}: WorkoutHeaderProps) {
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View className="flex-row items-center px-4 py-3">
      <Typography variant="body" className="w-16 font-mono">
        {formatTime(elapsedSeconds)}
      </Typography>

      <View className="mx-4 h-2 flex-1 rounded-full bg-muted">
        <View
          className="h-2 rounded-full bg-accent"
          style={{ width: `${progress}%` }}
        />
      </View>

      <Pressable onPress={onStop} className="p-2">
        <Ionicons name="close" size={24} color="#ef4444" />
      </Pressable>
    </View>
  );
}
