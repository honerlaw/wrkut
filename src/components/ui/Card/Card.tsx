import { Pressable, View } from "react-native";

type CardProps = {
  className?: string;
  children: React.ReactNode;
  onPress?: () => void;
};

export function Card({ className = "", children, onPress }: CardProps) {
  const baseClasses = `rounded-2xl border border-border bg-surface p-4 ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseClasses} active:bg-border`}
      >
        {children}
      </Pressable>
    );
  }

  return <View className={baseClasses}>{children}</View>;
}
