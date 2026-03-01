import { Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  children: React.ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent active:bg-accent-pressed",
  secondary: "bg-surface border border-border active:bg-border",
  destructive: "bg-destructive active:bg-red-600",
  ghost: "bg-transparent active:bg-surface",
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: "text-background",
  secondary: "text-text-primary",
  destructive: "text-white",
  ghost: "text-text-secondary",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2.5",
  lg: "px-6 py-3.5",
};

const SIZE_TEXT_CLASSES: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  onPress,
  className = "",
  children,
}: ButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`items-center justify-center rounded-xl ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      <Text
        className={`font-semibold ${SIZE_TEXT_CLASSES[size]} ${VARIANT_TEXT_CLASSES[variant]}`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
