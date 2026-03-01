import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";

const STORAGE_KEY = "wrkut:user-id";

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored) {
          setUserId(stored);
          setIsLoading(false);
          return;
        }

        const id = Crypto.randomUUID();
        await AsyncStorage.setItem(STORAGE_KEY, id);
        setUserId(id);

        fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).catch(() => {
          // Registration failed — will retry on next launch
        });
      } catch {
        // AsyncStorage failure — generate ephemeral ID
        const id = Crypto.randomUUID();
        setUserId(id);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  return { userId, isLoading };
}
