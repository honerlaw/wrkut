import { createContext, useContext } from "react";
import { ActivityIndicator, View } from "react-native";

import { useUserId } from "@/src/hooks/useUserId";

type UserContextValue = {
  userId: string | null;
  isLoading: boolean;
};

const UserContext = createContext<UserContextValue>({
  userId: null,
  isLoading: true,
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const value = useUserId();

  if (value.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
