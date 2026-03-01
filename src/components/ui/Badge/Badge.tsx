import { Text, View } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "destructive";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-surface border border-border",
  success: "bg-lime-500/20",
  warning: "bg-amber-500/20",
  destructive: "bg-red-500/20",
};

const VARIANT_TEXT_CLASSES: Record<BadgeVariant, string> = {
  default: "text-text-secondary",
  success: "text-accent",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function Badge({
  variant = "default",
  className = "",
  children,
}: BadgeProps) {
  return (
    <View
      className={`self-start rounded-full px-2.5 py-0.5 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <Text className={`text-xs font-medium ${VARIANT_TEXT_CLASSES[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
