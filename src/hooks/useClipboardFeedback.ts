import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Clipboard from "expo-clipboard";

export interface ClipboardFeedback {
  kind: "success" | "error";
  message: string;
}

/** Copy feedback stays inside the page, without presenting a native dialog. */
export function useClipboardFeedback() {
  const [feedback, setFeedback] = useState<ClipboardFeedback | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  const foreground = useRef(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    generation.current += 1;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    if (mounted.current) setFeedback(null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (state) => {
      foreground.current = state === "active";
      if (!foreground.current) reset();
    });
    return () => {
      mounted.current = false;
      generation.current += 1;
      if (timeout.current) clearTimeout(timeout.current);
      subscription.remove();
    };
  }, [reset]);

  const copy = useCallback(async (text: string, message = "已複製，可貼到其他 AI 使用。") => {
    if (!mounted.current || !foreground.current) return false;
    reset();
    const request = generation.current;
    try {
      const copied = await Clipboard.setStringAsync(text);
      if (copied === false) throw new Error("clipboard unavailable");
      if (mounted.current && foreground.current && request === generation.current) {
        setFeedback({ kind: "success", message });
        timeout.current = setTimeout(() => {
          timeout.current = null;
          if (mounted.current && request === generation.current) setFeedback(null);
        }, 3000);
      }
      return true;
    } catch {
      if (mounted.current && foreground.current && request === generation.current) {
        setFeedback({ kind: "error", message: "複製失敗，內容已保留，請再按一次複製。" });
      }
      return false;
    }
  }, [reset]);

  return { copy, feedback, reset, copied: feedback?.kind === "success" };
}
