/**
 * 命果 MINGO 解讀後「繼續聊」(教練式追問對話)。
 * 帶卦象 + 先前解讀上下文,呼叫後端 /api/v1/chat。與網頁同款泡泡 UI。
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { sendChat, ChatTurn, PromptRequest, ApiError } from "../api";
import { colors, radius, spacing } from "../theme";

export default function MingoChat({
  chartReq,
  reading,
  onBalance,
}: {
  chartReq: PromptRequest;
  reading: string;
  onBalance?: (b: number) => void;
}) {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    const hist = history; // 送出前的完整對話(成對)
    setBusy(true);
    setInput("");
    setHistory([...hist, { role: "user", content: msg }]);
    try {
      const res = await sendChat({ ...chartReq, reading, history: hist, message: msg });
      setHistory([...hist, { role: "user", content: msg }, { role: "assistant", content: res.reply }]);
      onBalance?.(res.balance);
    } catch (e) {
      const m = e instanceof ApiError ? e.message : "連線失敗,請稍後再試";
      setHistory([...hist, { role: "user", content: msg }, { role: "assistant", content: m }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.cta}>想再多聊聊嗎?我可以陪你把選擇想清楚 ✦</Text>

      {history.map((t, i) => (
        <View key={i} style={[styles.row, t.role === "user" ? styles.rowUser : styles.rowAi]}>
          <View style={[styles.bubble, t.role === "user" ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={t.role === "user" ? styles.txtUser : styles.txtAi}>{t.content}</Text>
          </View>
        </View>
      ))}
      {busy ? (
        <View style={[styles.row, styles.rowAi]}>
          <View style={[styles.bubble, styles.bubbleAi]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="例如:如果我選擇留下,要注意什麼?"
          placeholderTextColor={colors.subtle}
          editable={!busy}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable
          onPress={send}
          disabled={busy || !input.trim()}
          style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.45 }]}
        >
          <Text style={styles.sendTxt}>送出</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>每則回覆扣 1 點</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  cta: {
    fontSize: 13, color: colors.primary, fontWeight: "600",
    textAlign: "center", marginBottom: spacing.md,
  },
  row: { flexDirection: "row", marginBottom: 8 },
  rowUser: { justifyContent: "flex-end" },
  rowAi: { justifyContent: "flex-start" },
  bubble: { maxWidth: "82%", paddingVertical: 9, paddingHorizontal: 13, borderRadius: 16 },
  bubbleUser: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: "#F3F1F8", borderBottomLeftRadius: 4 },
  txtUser: { color: "#fff", fontSize: 14, lineHeight: 22 },
  txtAi: { color: colors.text, fontSize: 14, lineHeight: 23 },
  inputRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, alignItems: "center" },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: colors.text,
    backgroundColor: colors.card,
  },
  sendBtn: {
    backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingVertical: 9, paddingHorizontal: 18,
  },
  sendTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hint: { fontSize: 12, color: colors.subtle, marginTop: 6 },
});
