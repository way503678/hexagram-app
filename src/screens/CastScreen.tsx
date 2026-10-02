import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CastMode } from "../navTypes";
import { castChart, castByTime, buildPrompt, generateReading, ApiError } from "../api";
import MingoReading from "../components/MingoReading";
import MingoChat from "../components/MingoChat";
import MingoReflect from "../components/MingoReflect";
import { useAuth } from "../AuthContext";
import { castOneYao, yaoValsFromChart, YAO_NAMES } from "../divination";
import { CastYao, ChartResponse } from "../types";
import { colors, spacing } from "../theme";
import ChartResult from "../components/ChartResult";
import FortunePanel from "../components/FortunePanel";
import YaoGlyph from "../components/YaoGlyph";
import { featureFlags } from "../featureFlags";

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
  record_id?: number;
}

export default function CastScreen({
  route,
  navigation,
}: {
  route?: {
    params?: {
      mode?: CastMode;
      autoBirth?: {
        y: number; m: number; d: number; h: number;
        name?: string; gender?: "M" | "F" | "";
      };
    };
  };
  navigation?: { setParams?: (p: object) => void };
}) {
  const mode: CastMode = route?.params?.mode ?? "coin";
  const isTime = mode === "time";
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 400 || fontScale > 1.1;
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
  const [readingText, setReadingText] = useState<string | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingModalVisible, setReadingModalVisible] = useState(false);

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
    setReadingText(null);
    setReadingModalVisible(false);
    setCopied(false);
    setCollapsed(false);
    setBirth(null);
    setShowPicker(false);
  }

  /** 手動擲卦排盤。 */
  async function doChartCoin() {
    if (!done || loading) return;
    const q = question.trim();
    if (!q) {
      Alert.alert("請先填寫所問之事", "起卦前先填寫問題，完成後才能保存這次卦象。");
      return;
    }
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
      const res = await castChart({ ...input, question: q });
      setChart(res);
      setChartInput({ ...input, record_id: res.record_id });
      setCollapsed(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "排盤失敗,請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  /** 時辰起卦的核心(可帶明確參數,供手動排與自動帶入共用)。 */
  async function castTime(
    y: number, m: number, d: number, h: number,
    name: string, g: "M" | "F" | ""
  ) {
    setLoading(true);
    setError(null);
    try {
      const res = await castByTime({ y, m, d, h, name, gender: g });
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

  /** 時辰起卦(手動,讀畫面上的輸入)。 */
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
    await castTime(
      birth.getFullYear(), birth.getMonth() + 1,
      birth.getDate(), birth.getHours(), name, gender
    );
  }

  /** 從會員中心「查看我的命盤」帶生日進來 → 自動帶入並排盤。 */
  useEffect(() => {
    const ab = route?.params?.autoBirth;
    if (!isTime || !ab) return;
    const bd = new Date(ab.y, ab.m - 1, ab.d, ab.h);
    setBirth(bd);
    setNameStr(ab.name || "本人");
    const g = ab.gender || "";
    setGender(g);
    castTime(ab.y, ab.m, ab.d, ab.h, ab.name || "本人", g);
    // 清掉參數,避免切換分頁時重複觸發
    navigation?.setParams?.({ autoBirth: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.autoBirth]);

  async function doPrompt() {
    if (!chartInput || promptLoading) return;
    if (promptText) {
      await Clipboard.setStringAsync(promptText);
      setCopied(true);
      Alert.alert("已複製", "已購買的 Prompt 再次複製不會扣果實。");
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    const q = question.trim();
    if (!q) {
      Alert.alert("請先填寫所問之事", "上方「所問之事」要先填,Prompt 才能帶入問題。");
      return;
    }
    if (user && user.points_balance < 1) {
      Alert.alert("果實不足", "目前沒有果實，請先到會員中心儲值。");
      return;
    }
    setPromptLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await buildPrompt({ question: q, ...chartInput });
      setPromptText(res.prompt);
      setChartInput((prev) => prev ? { ...prev, record_id: res.record_id } : prev);
      await Clipboard.setStringAsync(res.prompt);
      setCopied(true);
      Alert.alert(
        res.charged ? "已產生並複製" : "已複製",
        res.charged
          ? "Prompt 已複製，並保存 30 天。"
          : "這份 Prompt 已購買，本次不會重複扣果實。"
      );
      // 扣點後更新本地餘額(會員頁即時顯示)
      if (user && typeof res.balance === "number") {
        setUser({ ...user, points_balance: res.balance });
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "產生 Prompt 失敗,請稍後再試";
      setError(message);
      Alert.alert(e instanceof ApiError && e.status === 402 ? "果實不足" : "無法產生 Prompt", message);
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

  async function doReading() {
    if (!chartInput || readingLoading) return;
    if (readingText) {
      setReadingModalVisible(true);
      return;
    }
    const q = question.trim();
    if (!q) {
      Alert.alert("請先填寫所問之事", "上方「所問之事」要先填,命果才知道要為你解什麼。");
      return;
    }
    if (user && user.points_balance < 1) {
      Alert.alert("果實不足", "目前沒有果實，請先到會員中心儲值。");
      return;
    }
    setReadingLoading(true);
    setError(null);
    setReadingText(null);
    setReadingModalVisible(false);
    try {
      const res = await generateReading({ question: q, ...chartInput });
      setReadingText(res.reading);
      setChartInput((prev) => prev ? { ...prev, record_id: res.record_id } : prev);
      setReadingModalVisible(true);
      if (user && typeof res.balance === "number") {
        setUser({ ...user, points_balance: res.balance });
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "解讀產生失敗,請稍後再試";
      setError(message);
      Alert.alert(e instanceof ApiError && e.status === 402 ? "果實不足" : "無法取得解讀", message);
    } finally {
      setReadingLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
          keyboardShouldPersistTaps="handled"
        >
          {collapsed ? (
            <View style={styles.collapsedBar}>
              <View style={styles.collapsedSummary}>
                <Text style={styles.collapsedEyebrow}>
                  {isTime ? "命盤已完成" : "卦象已完成"}
                </Text>
                <Text style={styles.collapsedText} numberOfLines={2}>
                  {question.trim() || (isTime ? "出生資料已收合" : "所問之事已收合")}
                </Text>
              </View>
              <View style={styles.collapsedActions}>
                <Pressable
                  onPress={() => setCollapsed(false)}
                  hitSlop={8}
                  style={styles.collapsedAction}
                >
                  <Text style={styles.collapsedToggle}>展開</Text>
                </Pressable>
                <Pressable onPress={reset} hitSlop={8} style={styles.collapsedAction}>
                  <Text style={styles.collapsedToggle}>重新起卦</Text>
                </Pressable>
              </View>
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
                  <Text style={styles.label}>今天要問什麼呢?</Text>
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
                <>
                {/* 動作鈕在上(對齊 web:擲卦/排盤在爻列表上方) */}
                {!done ? (
                  <PrimaryButton
                    label={`擲第 ${castCount + 1} 爻(${YAO_NAMES[castCount]})`}
                    onPress={castNext}
                    disabled={rolling}
                  />
                ) : (
                  <PrimaryButton
                    label={loading ? "排盤中…" : "排盤 →"}
                    onPress={doChartCoin}
                    disabled={loading}
                  />
                )}
                <View style={[styles.card, { marginTop: spacing.md }]}>
                  {[5, 4, 3, 2, 1, 0].map((idx) => {
                    const y = yaos[idx];
                    const isNext = idx === castCount && rolling;
                    return (
                      <View key={idx} style={styles.yaoRow}>
                        <Text style={styles.yaoLabel}>{YAO_NAMES[idx]}</Text>
                        <View style={styles.yaoGlyphCell}>
                          {isNext ? (
                            <Text style={styles.yaoPreview}>{preview || "⋯"}</Text>
                          ) : (
                            <YaoGlyph
                              yin={y?.陰陽 === "陰"}
                              moving={y?.動}
                              empty={!y}
                              width={104}
                            />
                          )}
                        </View>
                        <Text style={styles.yaoName}>
                          {isNext ? "擲卦中…" : y ? y.name : "未擲"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                </>
              )}

              {/* 動作(時辰模式;擲卦模式的按鈕已移到爻列表上方) */}
              {isTime && (
                <PrimaryButton
                  label={loading ? "排命盤中…" : "排命盤"}
                  onPress={doChartTime}
                  disabled={loading}
                />
              )}
            </>
          )}

          {loading && (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          )}
          {error && <Text style={styles.error}>{error}</Text>}

          {chart && (
            <View style={{ marginTop: spacing.lg }}>
              <ChartResult chart={chart} compact={compact} />
            </View>
          )}

          {/* 詳細流年／流月暫留程式，後續大版本再開放。 */}
          {isTime && chart && chartInput && (
            featureFlags.fortuneDetails ? (
              <FortunePanel
                birth={{ y: chartInput.y, m: chartInput.m, d: chartInput.d, h: chartInput.h }}
                gender={gender}
              />
            ) : (
              <View style={[styles.card, styles.comingSoonCard]}>
                <Text style={styles.comingSoonTitle}>流年運勢</Text>
                <Text style={styles.comingSoonLabel}>Coming Soon</Text>
              </View>
            )
          )}

          {!isTime && chartInput && (
            <View style={{ marginTop: spacing.lg }}>
              {/* 命果即時教練式解讀(主要)*/}
              <PrimaryButton
                label={readingText
                  ? "查看本次 AI 解讀（不扣果實）"
                  : readingLoading
                    ? "命果解讀中…"
                    : user && user.points_balance < 1
                      ? "果實不足，無法產生 AI 解讀"
                      : "✨ 命果為你解讀（扣 1 顆果實）"}
                onPress={doReading}
                disabled={readingLoading || promptLoading || Boolean(!readingText && user && user.points_balance < 1)}
              />
              {/* 進階:複製 prompt 自己貼到慣用 AI(次要)*/}
              <View style={{ marginTop: spacing.lg }}>
              <SecondaryButton
                label={promptText
                  ? "複製已產生的 Prompt（不扣果實）"
                  : promptLoading
                    ? "產生中…"
                    : user && user.points_balance < 1
                      ? "果實不足，無法產生 Prompt"
                      : "🤖 改用:複製解讀 Prompt（扣 1 顆果實）"}
                onPress={doPrompt}
                disabled={promptLoading || readingLoading || Boolean(!promptText && user && user.points_balance < 1)}
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
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={readingModalVisible && Boolean(readingText)}
        animationType="slide"
        transparent
        onRequestClose={() => setReadingModalVisible(false)}
      >
        <SafeAreaView style={styles.readingModalBackdrop}>
          <KeyboardAvoidingView
            style={styles.readingModalKeyboard}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.readingModalSheet}>
              <View style={styles.readingModalHeader}>
                <Text style={styles.readingModalTitle}>🔮 命果 AI 解讀</Text>
                <Pressable
                  onPress={() => setReadingModalVisible(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="關閉 AI 解讀"
                  style={styles.readingModalCloseIcon}
                >
                  <Text style={styles.readingModalCloseIconText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.readingModalScroll}
                contentContainerStyle={styles.readingModalContent}
                keyboardShouldPersistTaps="handled"
              >
                {readingText && chartInput && (
                  <>
                    <MingoReading text={readingText} />
                    <MingoChat
                      chartReq={{ question: question.trim(), ...chartInput }}
                      reading={readingText}
                      onBalance={(b) => {
                        if (user) setUser({ ...user, points_balance: b });
                      }}
                    />
                    <MingoReflect question={question.trim()} />
                  </>
                )}
              </ScrollView>

              <View style={styles.readingModalFooter}>
                <Pressable
                  style={styles.readingModalCloseButton}
                  onPress={() => setReadingModalVisible(false)}
                >
                  <Text style={styles.readingModalCloseButtonText}>關閉</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  scrollCompact: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
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
  comingSoonCard: { marginTop: spacing.lg, alignItems: "center", paddingVertical: spacing.xl },
  comingSoonTitle: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: 2 },
  comingSoonLabel: { color: colors.faint, fontSize: 13, fontWeight: "600", letterSpacing: 2, marginTop: spacing.sm },
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
  yaoGlyphCell: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  yaoPreview: {
    width: 104,
    textAlign: "center",
    fontSize: 20,
    color: colors.moving,
  },
  yaoName: { width: 76, textAlign: "right", color: colors.subtle, fontSize: 13 },
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
  readingModalBackdrop: {
    flex: 1,
    padding: 8,
    backgroundColor: "rgba(30,29,48,0.58)",
  },
  readingModalKeyboard: { flex: 1, justifyContent: "center", alignItems: "center" },
  readingModalSheet: {
    width: "100%",
    height: "96%",
    maxWidth: 760,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingModalHeader: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
  },
  readingModalTitle: { color: colors.primaryText, fontSize: 17, fontWeight: "800" },
  readingModalCloseIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  readingModalCloseIconText: { color: colors.primaryText, fontSize: 22, fontWeight: "700" },
  readingModalScroll: { flex: 1 },
  readingModalContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  readingModalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  readingModalCloseButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  readingModalCloseButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
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
    backgroundColor: "#F8F4FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  collapsedSummary: { minWidth: 0 },
  collapsedEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  collapsedText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  collapsedActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  collapsedAction: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  collapsedToggle: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  error: { marginTop: spacing.lg, color: colors.moving, textAlign: "center" },
});
