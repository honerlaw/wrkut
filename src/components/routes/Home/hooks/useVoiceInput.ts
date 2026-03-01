import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type UseVoiceInputReturn = {
  isListening: boolean;
  isAvailable: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
};

function getWebSpeechRecognition(): (new () => unknown) | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as Record<string, unknown>;
  return (win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null) as
    | (new () => unknown)
    | null;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      setIsAvailable(!!getWebSpeechRecognition());
    } else {
      setIsAvailable(true);
    }
  }, []);

  const startListening = useCallback(() => {
    if (Platform.OS === "web") {
      const SpeechRecognitionCtor = getWebSpeechRecognition();
      if (!SpeechRecognitionCtor) return;

      const recognition = new SpeechRecognitionCtor() as Record<
        string,
        unknown
      >;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: unknown) => {
        const e = event as {
          results: {
            length: number;
            [i: number]: { 0: { transcript: string } };
          };
        };
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
      (recognition as Record<string, unknown> & { start: () => void }).start();
      setIsListening(true);
      setTranscript("");
    } else {
      import("expo-speech-recognition").then(
        ({ ExpoSpeechRecognitionModule }) => {
          ExpoSpeechRecognitionModule.requestPermissionsAsync().then(
            (result) => {
              if (!result.granted) return;
              ExpoSpeechRecognitionModule.start({ interimResults: true });
              setIsListening(true);
              setTranscript("");
            },
          );
        },
      );
    }
  }, []);

  const stopListening = useCallback(() => {
    if (Platform.OS === "web") {
      const rec = recognitionRef.current as
        | (Record<string, unknown> & { stop: () => void })
        | null;
      rec?.stop();
    } else {
      import("expo-speech-recognition").then(
        ({ ExpoSpeechRecognitionModule }) => {
          ExpoSpeechRecognitionModule.stop();
        },
      );
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    isAvailable,
    startListening,
    stopListening,
    transcript,
  };
}
