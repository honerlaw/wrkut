import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "wrkut_theme";

type ThemeContextValue = {
  colorScheme: "light" | "dark";
  toggleTheme: () => void;
  isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "dark",
  toggleTheme: () => {},
  isLoaded: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") {
        setColorScheme(stored);
      } else {
        setColorScheme("dark");
      }
      setIsLoaded(true);
    });
  }, [setColorScheme]);

  const toggleTheme = () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  return (
    <ThemeContext.Provider
      value={{ colorScheme: colorScheme ?? "dark", toggleTheme, isLoaded }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
