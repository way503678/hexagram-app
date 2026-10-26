import React from "react";
import { Text } from "react-native";
import { ClipboardFeedback } from "../hooks/useClipboardFeedback";
import { colors, spacing } from "../theme";

export default function CopyFeedback({ feedback }: { feedback: ClipboardFeedback | null }) {
  if (!feedback) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={{
      color: feedback.kind === "error" ? colors.moving : colors.primary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.sm,
    }}>
      {feedback.message}
    </Text>
  );
}
