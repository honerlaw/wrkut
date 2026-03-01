import "./global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

import { UserProvider } from "@/src/components/UserProvider";

export default function RootLayout() {
  return (
    <UserProvider>
      <View className="flex-1 bg-background">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </View>
    </UserProvider>
  );
}
