import { useState } from "react";
import { type KeyboardTypeOptions, TextInput } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
};

export function Input({
  value,
  onChangeText,
  placeholder,
  className = "",
  multiline = false,
  keyboardType,
  secureTextEntry = false,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const colors = useThemeColors();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`rounded-xl border bg-surface px-4 py-3 text-text-primary ${focused ? "border-accent" : "border-border"} ${className}`}
    />
  );
}
