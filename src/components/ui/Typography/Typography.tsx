import { Text } from "react-native";

type TypographyVariant = "h1" | "h2" | "h3" | "body" | "caption" | "label";

type TypographyProps = {
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
};

const VARIANT_CLASSES: Record<TypographyVariant, string> = {
  h1: "text-3xl font-bold text-text-primary",
  h2: "text-2xl font-bold text-text-primary",
  h3: "text-xl font-semibold text-text-primary",
  body: "text-base text-text-primary",
  caption: "text-sm text-text-secondary",
  label: "text-xs font-medium uppercase tracking-wider text-text-secondary",
};

export function Typography({
  variant = "body",
  className = "",
  children,
}: TypographyProps) {
  return (
    <Text className={`${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </Text>
  );
}
