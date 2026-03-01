import { Modal, Pressable, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";

type DeleteRoutineDialogProps = {
  visible: boolean;
  routineName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
};

export function DeleteRoutineDialog({
  visible,
  routineName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteRoutineDialogProps) {
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
          <Typography variant="h2">Delete Routine</Typography>
          <Typography variant="body" className="mt-3 text-text-secondary">
            Are you sure you want to delete &quot;{routineName}&quot;? This
            action cannot be undone.
          </Typography>
          <View className="mt-6 flex-row gap-3">
            <View className="flex-1">
              <Button variant="ghost" onPress={onCancel}>
                Cancel
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="destructive"
                onPress={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
