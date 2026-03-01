import { Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Typography } from "@/src/components/ui/Typography";
import type { CreateRoutineInput } from "@/src/types/routine";

type WorkoutPlanCardProps = {
  plan: CreateRoutineInput;
  onAccept: () => void;
  accepted?: boolean;
};

export function WorkoutPlanCard({
  plan,
  onAccept,
  accepted,
}: WorkoutPlanCardProps) {
  return (
    <Card className="my-2 border-accent">
      <Typography variant="h3">{plan.name}</Typography>
      {plan.description ? (
        <Typography variant="caption" className="mt-1">
          {plan.description}
        </Typography>
      ) : null}
      {plan.frequency ? (
        <Typography variant="caption" className="mt-0.5">
          {plan.frequency}
        </Typography>
      ) : null}

      <View className="mt-3 gap-2">
        {plan.days.map((day, i) => (
          <View key={i} className="rounded-xl bg-background px-3 py-2">
            <Text className="font-medium text-text-primary">
              {day.dayLabel}
            </Text>
            <Text className="text-sm text-text-secondary">
              {day.exercises.length} exercise
              {day.exercises.length !== 1 ? "s" : ""}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-3">
        {accepted ? (
          <Button variant="secondary" disabled>
            Plan Saved
          </Button>
        ) : (
          <Button onPress={onAccept}>Accept Plan</Button>
        )}
      </View>
    </Card>
  );
}
