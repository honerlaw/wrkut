import { Modal, Pressable, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";

type StopWorkoutDialogProps = {
  visible: boolean;
  completedSets: number;
  totalSets: number;
  onSaveAndStop: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export function StopWorkoutDialog({
  visible,
  completedSets,
  totalSets,
  onSaveAndStop,
  onDiscard,
  onCancel,
}: StopWorkoutDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center bg-black/60 px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-2xl border border-border bg-surface p-6"
        >
          <Typography variant="h2">Stop Workout?</Typography>
          <Typography variant="body" className="mt-3 text-text-secondary">
            You&apos;ve completed {completedSets} of {totalSets} sets.
          </Typography>
          <View className="mt-6 gap-3">
            <Button variant="secondary" onPress={onSaveAndStop}>
              Save Progress
            </Button>
            <Button variant="destructive" onPress={onDiscard}>
              Discard
            </Button>
            <Button variant="ghost" onPress={onCancel}>
              Keep Going
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
