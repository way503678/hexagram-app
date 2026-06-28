/**
 * 命果 MINGO 成長反思(免費):解讀後問「最有感的一句」→ AI 生成本週小目標。
 * 與網頁 #manual-reflect 同流程。
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
import { createReflection, ApiError } from "../api";
import { colors, radius, spacing } from "../theme";

export default function MingoReflect({ question }: { question?: string }) {
  const [feeling, setFeeling] = useState("");
  const [busy, setBusy] = useState(false);
  const [goal, setGoal] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const f = feeling.trim();
    if (!f || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await createReflection(f, question);
      setGoal(res.goal);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "儲存失敗,請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.cta}>🌱 看完這次解讀,你覺得最有感的是哪一句?</Text>
      {goal ? (
        <View style={styles.result}>
          <Text style={styles.resultLead}>那這週,我們設定一件小事:</Text>
          <Text style={styles.goal}>✦ {goal}</Text>
          <Text style={styles.resultHint}>
            下週我會在會員中心(或寄信)提醒你,一起看看它帶來哪些變化。
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={feeling}
              onChangeText={setFeeling}
              placeholder="例如:我覺得我一直太急了"
              placeholderTextColor={colors.subtle}
              editable={!busy}
              onSubmitEditing={save}
              returnKeyType="done"
            />
            <Pressable
              onPress={save}
              disabled={busy || !feeling.trim()}
              style={[styles.btn, (busy || !feeling.trim()) && { opacity: 0.45 }]}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>記下來</Text>}
            </Pressable>
          </View>
          <Text style={styles.hint}>免費。我會幫你變成這週可以做到的一件小事,下週再提醒你。</Text>
          {err ? <Text style={styles.err}>{err}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  cta: { fontSize: 14, color: colors.primary, fontWeight: "600", marginBottom: spacing.sm },
  inputRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.card,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hint: { fontSize: 12, color: colors.subtle, marginTop: 6 },
  err: { fontSize: 13, color: "#c0392b", marginTop: 6 },
  result: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    backgroundColor: "#FBF8FF",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
  },
  resultLead: { fontSize: 14, color: colors.text },
  goal: { fontSize: 16, fontWeight: "700", color: colors.primaryDark, marginVertical: 8, lineHeight: 24 },
  resultHint: { fontSize: 12, color: colors.subtle, lineHeight: 19 },
});
