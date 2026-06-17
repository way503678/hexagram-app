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
import DateTimePicker from "@react-native-community/datetimepicker";
import { CastMode } from "../navTypes";
import { castChart, castByTime, buildPrompt, ApiError } from "../api";
import { useAuth } from "../AuthContext";
import { castOneYao, yaoValsFromChart, YAO_NAMES } from "../divination";
import { CastYao, ChartResponse } from "../types";
import { colors, spacing } from "../theme";
import ChartResult from "../components/ChartResult";
import FortunePanel from "../components/FortunePanel";

const EMPTY: (CastYao | null)[] = [null, null, null, null, null, null];

/** 轉輪起始位置(僅供捲動起點,未選前不算數)。 */
const DEFAULT_BIRTH = new Date(2000, 0, 1, 12, 0);

const pad = (n: number) => String(n).padStart(2, "0");
function formatBirth(d: Date): string {
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}時`;
}

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
  const { user, setUser } = useAuth();

  const [question, setQuestion] = useState("");

  // 手動擲卦狀態
  const [yaos, setYaos] = useState<(CastYao | null)[]>(EMPTY);
  const [rolling, setRolling] = useState(false);
  const [preview, setPreview] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 命盤排卦輸入(出生時間預設未選)
  const [nameStr, setNameStr] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [birth, setBirth] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

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
    setBirth(null);
    setShowPicker(false);
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
    if (!birth) {
      Alert.alert("請選擇出生時間", "點上方欄位選擇出生年月日與時辰。");
      return;
    }
    const y = birth.getFullYear();
    const m = birth.getMonth() + 1;
    const d = birth.getDate();
    const h = birth.getHours();
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
      // 扣點後更新本地餘額(會員頁即時顯示)
      if (user && typeof res.balance === "number") {
        setUser({ ...user, points_balance: res.balance });
      }
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
                    <Pressable
                      style={styles.pickerField}
                      onPress={() => setShowPicker((s) => !s)}
                    >
                      <Text style={birth ? styles.pickerValue : styles.pickerPlaceholder}>
                        {birth ? formatBirth(birth) : "點此選擇出生年月日與時辰"}
                      </Text>
                    </Pressable>
                    {showPicker && (
                      <View style={styles.pickerWrap}>
                        <DateTimePicker
                          value={birth ?? DEFAULT_BIRTH}
                          mode="datetime"
                          display="spinner"
                          maximumDate={new Date()}
                          minimumDate={new Date(1900, 0, 1)}
                          onChange={(_e, d) => {
                            if (d) setBirth(d);
                            if (Platform.OS !== "ios") setShowPicker(false);
                          }}
                        />
                        {Platform.OS === "ios" && (
                          <Pressable
                            style={styles.pickerDone}
                            onPress={() => setShowPicker(false)}
                          >
                            <Text style={styles.pickerDoneText}>完成</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                    <Text style={styles.hint}>命盤以出生時辰排盤;時辰以 00:00 換日。</Text>
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

          {/* 命盤排卦:卦象後接流年面板 */}
          {isTime && chart && chartInput && (
            <FortunePanel
              birth={{ y: chartInput.y, m: chartInput.m, d: chartInput.d, h: chartInput.h }}
              gender={gender}
            />
          )}

          {!isTime && chartInput && (
            <View style={{ marginTop: spacing.lg }}>
              <SecondaryButton
                label={promptLoading ? "產生中…" : "🤖 產生 AI 解讀 Prompt（扣 1 點）"}
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
  pickerField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: "#fafafa",
  },
  pickerValue: { fontSize: 16, color: colors.text },
  pickerPlaceholder: { fontSize: 15, color: colors.subtle },
  pickerWrap: { marginTop: spacing.sm },
  pickerDone: {
    alignSelf: "flex-end",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pickerDoneText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
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
