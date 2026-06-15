import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { CastMode } from "../navTypes";
import { castChart, castByTime, buildPrompt, ApiError } from "../api";
import { castOneYao, yaoValsFromChart, YAO_NAMES } from "../divination";
import { CastYao, ChartResponse } from "../types";
import { colors, spacing } from "../theme";
import ChartResult from "../components/ChartResult";

const EMPTY: (CastYao | null)[] = [null, null, null, null, null, null];

/** 排盤後固定下來、供產生 Prompt 用的輸入(六爻 + 當時日期)。 */
interface ChartInput {
  yao_vals: string[];
  y: number;
  m: number;
  d: number;
  h: number;
}

export default function CastScreen({ mode }: { mode: CastMode }) {
  const isTime = mode === "time";

  const [question, setQuestion] = useState("");

  // 手動擲卦狀態
  const [yaos, setYaos] = useState<(CastYao | null)[]>(EMPTY);
  const [rolling, setRolling] = useState(false);
  const [preview, setPreview] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 時辰起卦輸入(預設現在)
  const now = new Date();
  const [nameStr, setNameStr] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [yStr, setYStr] = useState(String(now.getFullYear()));
  const [mStr, setMStr] = useState(String(now.getMonth() + 1));
  const [dStr, setDStr] = useState(String(now.getDate()));
  const [hStr, setHStr] = useState(String(now.getHours()));

  // 共用
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [chartInput, setChartInput] = useState<ChartInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [promptText, setPromptText] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
          next[castCount] = result;
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
    setChartInput(null);
    setError(null);
    setRolling(false);
    setPreview("");
    setPromptText(null);
    setCopied(false);
    setCollapsed(false);
  }

  /** 手動擲卦排盤。 */
  async function doChartCoin() {
    if (!done || loading) return;
    setLoading(true);
    setError(null);
    const n = new Date();
    const input: ChartInput = {
      yao_vals: yaos.map((y) => (y as CastYao).val),
      y: n.getFullYear(),
      m: n.getMonth() + 1,
      d: n.getDate(),
      h: n.getHours(),
    };
    try {
      const res = await castChart(input);
      setChart(res);
      setChartInput(input);
      setCollapsed(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "排盤失敗,請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  /** 時辰起卦。 */
  async function doChartTime() {
    if (loading) return;
    const name = nameStr.trim();
    if (!name) {
      Alert.alert("請填姓名", "排命盤需要填寫姓名(會存入紀錄)。");
      return;
    }
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const h = parseInt(hStr, 10);
    if ([y, m, d, h].some((v) => Number.isNaN(v))) {
      Alert.alert("日期時間有誤", "請確認年、月、日、時都填數字。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await castByTime({ y, m, d, h, name, gender });
      setChart(res);
      // 反推 yao_vals,讓時辰模式也能產生 Prompt
      setChartInput({ yao_vals: yaoValsFromChart(res), y, m, d, h });
      setCollapsed(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "起卦失敗,請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  async function doPrompt() {
    if (!chartInput || promptLoading) return;
    const q = question.trim();
    if (!q) {
      Alert.alert("請先填寫所問之事", "上方「所問之事」要先填,Prompt 才能帶入問題。");
      return;
    }
    setPromptLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await buildPrompt({ question: q, ...chartInput });
      setPromptText(res.prompt);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "產生 Prompt 失敗,請稍後再試");
    } finally {
      setPromptLoading(false);
    }
  }

  async function copyPrompt() {
    if (!promptText) return;
    await Clipboard.setStringAsync(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {collapsed ? (
            <View style={styles.collapsedBar}>
              <Text style={styles.collapsedText} numberOfLines={1}>
                {isTime ? "🕐" : "🪙"} 已排盤{question ? `・${question}` : ""}
              </Text>
              <Pressable onPress={() => setCollapsed(false)} hitSlop={8}>
                <Text style={styles.collapsedToggle}>展開</Text>
              </Pressable>
              <Pressable onPress={reset} hitSlop={8}>
                <Text style={styles.collapsedToggle}>重新起卦</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                {isTime
                  ? "填入姓名與出生時間,排出命盤。"
                  : "先想清楚要問什麼,再由初爻起依序擲六次。"}
              </Text>

              {/* 所問之事(僅手動擲卦;時辰起卦不需要) */}
              {!isTime && (
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
              )}

              {isTime ? (
                <>
                  <View style={styles.card}>
                    <Text style={styles.label}>占卜者</Text>
                    <TextInput
                      style={styles.nameInput}
                      placeholder="姓名(必填)"
                      placeholderTextColor={colors.subtle}
                      value={nameStr}
                      onChangeText={setNameStr}
                      maxLength={30}
                    />
                    <View style={styles.genderRow}>
                      {(
                        [
                          ["F", "女"],
                          ["M", "男"],
                        ] as const
                      ).map(([g, lbl]) => (
                        <Pressable
                          key={g}
                          onPress={() => setGender((cur) => (cur === g ? "" : g))}
                          style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                        >
                          <Text
                            style={[
                              styles.genderText,
                              gender === g && styles.genderTextActive,
                            ]}
                          >
                            {lbl}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.label}>出生時間</Text>
                    <View style={styles.dtRow}>
                      <DtField label="年" value={yStr} onChange={setYStr} w={70} />
                      <DtField label="月" value={mStr} onChange={setMStr} w={48} />
                      <DtField label="日" value={dStr} onChange={setDStr} w={48} />
                      <DtField label="時" value={hStr} onChange={setHStr} w={48} />
                    </View>
                    <Text style={styles.hint}>24 小時制,例如下午 4 點填 16。</Text>
                  </View>
                </>
              ) : (
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
              )}

              {/* 動作 */}
              {isTime ? (
                <PrimaryButton
                  label={loading ? "排命盤中…" : "排命盤"}
                  onPress={doChartTime}
                  disabled={loading}
                />
              ) : !done ? (
                <PrimaryButton
                  label={`擲第 ${castCount + 1} 爻(${YAO_NAMES[castCount]})`}
                  onPress={castNext}
                  disabled={rolling}
                />
              ) : (
                <PrimaryButton
                  label={loading ? "排盤中…" : "排盤"}
                  onPress={doChartCoin}
                  disabled={loading}
                />
              )}
              {!isTime && castCount > 0 && (
                <Pressable onPress={reset} style={styles.resetBtn} hitSlop={8}>
                  <Text style={styles.resetText}>重新擲卦</Text>
                </Pressable>
              )}
            </>
          )}

          {loading && (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          )}
          {error && <Text style={styles.error}>{error}</Text>}

          {chart && (
            <View style={{ marginTop: spacing.lg }}>
              <ChartResult chart={chart} />
            </View>
          )}

          {!isTime && chartInput && (
            <View style={{ marginTop: spacing.lg }}>
              <SecondaryButton
                label={promptLoading ? "產生中…" : "🤖 產生 AI 解讀 Prompt"}
                onPress={doPrompt}
                disabled={promptLoading}
              />
              {promptText && (
                <View style={[styles.card, { marginTop: spacing.md }]}>
                  <View style={styles.promptHeader}>
                    <Text style={styles.label}>AI 解讀 Prompt</Text>
                    <Pressable onPress={copyPrompt} hitSlop={8}>
                      <Text style={styles.copyBtn}>{copied ? "✓ 已複製" : "複製"}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.hint}>
                    複製後貼到 ChatGPT / Claude 等 AI,即可取得解讀。
                  </Text>
                  <ScrollView style={styles.promptBox} nestedScrollEnabled>
                    <Text selectable style={styles.promptText}>
                      {promptText}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DtField({
  label,
  value,
  onChange,
  w,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  w: number;
}) {
  return (
    <View style={styles.dtField}>
      <TextInput
        style={[styles.dtInput, { width: w }]}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Text style={styles.dtLabel}>{label}</Text>
    </View>
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

function SecondaryButton({
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
        styles.btnSecondary,
        disabled && styles.btnSecondaryDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={styles.btnSecondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg },
  subtitle: { marginBottom: spacing.lg, color: colors.subtle },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
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
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  genderRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "#f3eaf8",
  },
  genderText: { fontSize: 15, color: colors.subtle },
  genderTextActive: { color: colors.primary, fontWeight: "700" },
  dtRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dtField: { flexDirection: "row", alignItems: "center" },
  dtInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  dtLabel: { marginLeft: 4, color: colors.subtle, fontSize: 14 },
  yaoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
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
  btnSecondary: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnSecondaryDisabled: { opacity: 0.5 },
  btnSecondaryText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyBtn: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  hint: { color: colors.subtle, fontSize: 12, marginTop: 2 },
  promptBox: {
    maxHeight: 260,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: "#fafafa",
  },
  promptText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  collapsedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  collapsedText: { flex: 1, color: colors.text, fontSize: 14 },
  collapsedToggle: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  resetBtn: { alignSelf: "center", paddingVertical: spacing.md },
  resetText: { color: colors.subtle, fontSize: 14, textDecorationLine: "underline" },
  error: { marginTop: spacing.lg, color: colors.moving, textAlign: "center" },
});
