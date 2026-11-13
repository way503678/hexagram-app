import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, emailReading } from "../api";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";

export default function EmailReadingButton({ recordId }: { recordId: number }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  async function send() {
    if (inFlight.current) return;
    if (!user?.email_verified || !user.email) {
      setFailed(true);
      setMessage("請先至「我的」完成 Email 驗證，再寄送解讀。");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await emailReading(recordId);
      setFailed(false);
      setMessage(`已寄送至 ${result.email}，請查看收件匣或垃圾郵件。`);
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof ApiError ? e.message : "寄送失敗，請稍後再試。");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.note}>免費寄送至 {user?.email || "本人已驗證的 Email"}</Text>
      <Pressable accessibilityRole="button" testID="email-reading" disabled={busy} onPress={send}
        style={[styles.button, busy && { opacity: 0.5 }]}>
        <Text style={styles.label}>{busy ? "寄送中…" : "將解讀結果寄送至 Email"}</Text>
      </Pressable>
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.note, failed && styles.error]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24, gap: 10 },
  button: { borderWidth: 1, borderColor: colors.primary, borderRadius: 10, padding: 12, minHeight: 44, alignItems: "center" },
  label: { fontSize: 14, lineHeight: 22, fontWeight: "700", color: colors.primary, textAlign: "center" },
  note: { fontSize: 12, lineHeight: 20, color: colors.subtle },
  error: { color: colors.moving },
});
