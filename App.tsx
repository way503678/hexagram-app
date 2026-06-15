import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { castChart, ApiError } from "./src/api";
import { castOneYao, YAO_NAMES } from "./src/divination";
import { CastYao, ChartResponse } from "./src/types";
import { colors, spacing } from "./src/theme";
import ChartResult from "./src/components/ChartResult";

const EMPTY: (CastYao | null)[] = [null, null, null, null, null, null];

export default function App() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  );
}

function Screen() {
  const [question, setQuestion] = useState("");
  const [yaos, setYaos] = useState<(CastYao | null)[]>(EMPTY);
  const [rolling, setRolling] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const castCount = yaos.filter(Boolean).length;
  const done = castCount === 6;

  function castNext() {
    if (rolling || done) return;
    setRolling(true);
    setError(null);
    let flips = 0;
    timer.current = setInterval(() => {
      setPreview(castOneYao().symbol);
      flips += 1;
      if (flips >= 6) {
        if (timer.current) clearInterval(timer.current);
        const result = castOneYao();
        setYaos((prev) => {
          const next = [...prev];
          next[castCount] = result; // castCount = 下一個要擲的 index(初爻起)
          return next;
        });
        setPreview("");
        setRolling(false);
      }
    }, 70);
  }

  function reset() {
    if (timer.current) clearInterval(timer.current);
    setYaos(EMPTY);
    setChart(null);
    setError(null);
    setRolling(false);
    setPreview("");
  }

  async function doChart() {
    if (!done || loading) return;
    setLoading(true);
    setError(null);
    setChart(null);
    const now = new Date();
    try {
      const res = await castChart({
        y: now.getFullYear(),
        m: now.getMonth() + 1,
        d: now.getDate(),
        h: now.getHours(),
        yao_vals: yaos.map((y) => (y as CastYao).val),
      });
      setChart(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "排盤失敗,請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>🪙 金錢卦排盤</Text>
          <Text style={styles.subtitle}>
            先想清楚要問什麼,再由初爻起依序擲六次。
          </Text>

          {/* 所問之事(先填,供日後 AI 解讀) */}
          <View style={styles.card}>
            <Text style={styles.label}>所問之事</Text>
            <TextInput
              style={styles.input}
              placeholder="例如:我下週的面試會順利嗎?"
              placeholderTextColor={colors.subtle}
              value={question}
              onChangeText={setQuestion}
              maxLength={500}
              multiline
            />
          </View>

          {/* 六爻(上→初) */}
          <View style={styles.card}>
            {[5, 4, 3, 2, 1, 0].map((idx) => {
              const y = yaos[idx];
              const isNext = idx === castCount && rolling;
              return (
                <View key={idx} style={styles.yaoRow}>
                  <Text style={styles.yaoLabel}>{YAO_NAMES[idx]}</Text>
                  <Text
                    style={[
                      styles.yaoSymbol,
                      y?.動 && { color: colors.moving },
                      !y && styles.yaoEmpty,
                    ]}
                  >
                    {isNext ? preview || "⋯" : y ? y.symbol : "──────"}
                  </Text>
                  <Text style={styles.yaoName}>
                    {isNext ? "擲卦中…" : y ? y.name : "未擲"}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 操作按鈕 */}
          {!done ? (
            <PrimaryButton
              label={`擲第 ${castCount + 1} 爻(${YAO_NAMES[castCount]})`}
              onPress={castNext}
              disabled={rolling}
            />
          ) : (
            <PrimaryButton
              label={loading ? "排盤中…" : "排盤"}
              onPress={doChart}
              disabled={loading}
            />
          )}
          {castCount > 0 && (
            <Pressable onPress={reset} style={styles.resetBtn} hitSlop={8}>
              <Text style={styles.resetText}>重新擲卦</Text>
            </Pressable>
          )}

          {loading && (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.lg }}
            />
          )}
          {error && <Text style={styles.error}>{error}</Text>}

          {chart && (
            <View style={{ marginTop: spacing.lg }}>
              <ChartResult chart={chart} />
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: colors.subtle,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: "top",
  },
  yaoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  yaoLabel: { width: 48, color: colors.subtle, fontSize: 14 },
  yaoSymbol: {
    flex: 1,
    fontSize: 22,
    letterSpacing: 2,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  yaoEmpty: { color: colors.border },
  yaoName: { width: 84, textAlign: "right", color: colors.subtle, fontSize: 13 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { backgroundColor: "#b9a7c4" },
  btnText: { color: colors.primaryText, fontSize: 17, fontWeight: "700" },
  resetBtn: { alignSelf: "center", paddingVertical: spacing.md },
  resetText: {
    color: colors.subtle,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  error: {
    marginTop: spacing.lg,
    color: colors.moving,
    textAlign: "center",
  },
});
