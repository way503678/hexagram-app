import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing } from "../theme";
import { useAuth } from "../AuthContext";
import {
  fetchLedger,
  updateProfile,
  fetchMyQuestions,
  changePassword,
  deleteAccount,
  LedgerEntry,
  MyQuestion,
  ApiError,
  fetchDueReflections,
  markReflectionDone,
  Reflection,
} from "../api";

/** 帳本 reason 轉中文。 */
const REASON_LABEL: Record<string, string> = {
  welcome_bonus: "新會員贈點",
  test_topup: "測試儲值",
  divination: "AI 解盤扣點",
  prompt: "AI Prompt 產生",
  refund: "解盤失敗退點",
  admin_adjust: "管理員調整",
};

function reasonText(reason: string): string {
  return REASON_LABEL[reason] || reason;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const DEFAULT_BIRTH = new Date(2000, 0, 1, 12, 0);

export default function MemberScreen() {
  const { user, logout, refresh, setUser } = useAuth();
  const nav = useNavigation<any>();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [due, setDue] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  // 修改會員資料
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"M" | "F" | "">("");
  const [editBirth, setEditBirth] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // 我的紀錄
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MyQuestion[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  // 修改密碼
  const [showPwd, setShowPwd] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  // 刪除帳號
  const [showDel, setShowDel] = useState(false);
  const [delPwd, setDelPwd] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
      const { ledger: rows } = await fetchLedger();
      setLedger(rows);
      try {
        const { reflections } = await fetchDueReflections();
        setDue(reflections);
      } catch {
        /* 反思讀取失敗不影響主畫面 */
      }
    } catch {
      /* 讀取失敗就維持原狀,下拉可重試 */
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  async function doneReflection(id: number) {
    setDue((arr) => arr.filter((r) => r.id !== id)); // 樂觀更新
    try {
      await markReflectionDone(id);
    } catch {
      load(); // 失敗就重載還原
    }
  }

  if (!user) return null;

  const hasBirth =
    user.birth_y != null &&
    user.birth_m != null &&
    user.birth_d != null &&
    user.birth_h != null;

  function openEdit() {
    setEditName(user!.display_name || "");
    setEditGender((user!.gender as "M" | "F" | null) || "");
    setEditBirth(
      hasBirth
        ? new Date(user!.birth_y!, user!.birth_m! - 1, user!.birth_d!, user!.birth_h!)
        : null
    );
    setEditing(true);
  }

  function viewMyChart() {
    nav.navigate("Cast", {
      mode: "time",
      autoBirth: {
        y: user!.birth_y!,
        m: user!.birth_m!,
        d: user!.birth_d!,
        h: user!.birth_h!,
        name: user!.display_name || "本人",
        gender: (user!.gender as "M" | "F" | null) || "",
      },
    });
  }

  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    try {
      const { user: u } = await updateProfile({
        display_name: editName.trim() || undefined,
        gender: editGender,
        birth_y: editBirth ? editBirth.getFullYear() : null,
        birth_m: editBirth ? editBirth.getMonth() + 1 : null,
        birth_d: editBirth ? editBirth.getDate() : null,
        birth_h: editBirth ? editBirth.getHours() : null,
      });
      setUser(u);
      setEditing(false);
    } catch (e) {
      Alert.alert("儲存失敗", e instanceof ApiError ? e.message : "請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  async function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next && history === null) {
      setHistoryLoading(true);
      try {
        const { questions } = await fetchMyQuestions();
        setHistory(questions);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
  }

  async function doChangePassword() {
    if (pwdBusy) return;
    if (newPwd !== newPwd2) {
      Alert.alert("無法更新", "兩次輸入的新密碼不一致");
      return;
    }
    if (newPwd.length < 8 || !(/[A-Za-z]/.test(newPwd) && /\d/.test(newPwd))) {
      Alert.alert("無法更新", "新密碼至少 8 碼,且需英數混合");
      return;
    }
    setPwdBusy(true);
    try {
      await changePassword(curPwd, newPwd, newPwd2);
      setCurPwd(""); setNewPwd(""); setNewPwd2(""); setShowPwd(false);
      Alert.alert("完成", "密碼已更新");
    } catch (e) {
      Alert.alert("更新失敗", e instanceof ApiError ? e.message : "請稍後再試");
    } finally {
      setPwdBusy(false);
    }
  }

  function doDeleteAccount() {
    if (delBusy) return;
    Alert.alert("永久刪除帳號", "刪除後資料、果實、紀錄都會永久消失且無法復原,確定?", [
      { text: "取消", style: "cancel" },
      {
        text: "永久刪除",
        style: "destructive",
        onPress: async () => {
          setDelBusy(true);
          try {
            await deleteAccount(delPwd);
            await logout();  // 清 token、回登入頁
          } catch (e) {
            Alert.alert("刪除失敗", e instanceof ApiError ? e.message : "請稍後再試");
            setDelBusy(false);
          }
        },
      },
    ]);
  }

  function onLogout() {
    Alert.alert("登出", "確定要登出嗎?", [
      { text: "取消", style: "cancel" },
      { text: "登出", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* 會員卡 */}
        <View style={styles.card}>
          <Text style={styles.name}>{user.display_name || "會員"}</Text>
          {!!user.email && <Text style={styles.email}>{user.email}</Text>}
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>剩餘果實</Text>
            <Text style={styles.points}>{user.points_balance}</Text>
          </View>
          <TouchableOpacity style={styles.editLink} onPress={openEdit}>
            <Text style={styles.editLinkText}>修改會員資料</Text>
          </TouchableOpacity>
        </View>

        {/* 🌱 成長反思回訪(到期才出現)*/}
        {due.length > 0 && (
          <View style={styles.reflectCard}>
            <Text style={styles.reflectTitle}>🌱 上週你給自己的小事</Text>
            {due.map((r) => (
              <View key={r.id} style={styles.reflectItem}>
                {!!r.feeling && (
                  <Text style={styles.reflectFeeling}>當時你最有感的:「{r.feeling}」</Text>
                )}
                <Text style={styles.reflectGoal}>✦ {r.goal}</Text>
                <Text style={styles.reflectAsk}>這週過得如何?有試著做做看嗎?</Text>
                <TouchableOpacity style={styles.reflectBtn} onPress={() => doneReflection(r.id)}>
                  <Text style={styles.reflectBtnTxt}>我回顧過了 ✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 修改會員資料(展開式) */}
        {editing && (
          <View style={styles.editCard}>
            <Text style={styles.editLabel}>暱稱</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="顯示名稱"
              placeholderTextColor={colors.subtle}
            />
            <Text style={styles.editLabel}>性別</Text>
            <View style={styles.genderRow}>
              {([["M", "男"], ["F", "女"], ["", "不設定"]] as const).map(
                ([val, label]) => (
                  <TouchableOpacity
                    key={label}
                    style={[styles.genderBtn, editGender === val && styles.genderBtnOn]}
                    onPress={() => setEditGender(val)}
                  >
                    <Text
                      style={[
                        styles.genderBtnText,
                        editGender === val && styles.genderBtnTextOn,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            <Text style={styles.editLabel}>生日(命盤排卦用)</Text>
            <Pressable style={styles.input} onPress={() => setShowPicker((v) => !v)}>
              <Text style={editBirth ? styles.pickerValue : styles.pickerPlaceholder}>
                {editBirth
                  ? `${editBirth.getFullYear()}/${pad(editBirth.getMonth() + 1)}/${pad(
                      editBirth.getDate()
                    )} ${pad(editBirth.getHours())}時`
                  : "點此選擇出生年月日與時辰"}
              </Text>
            </Pressable>
            {showPicker && (
              <View>
                <DateTimePicker
                  value={editBirth ?? DEFAULT_BIRTH}
                  mode="datetime"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={(_e, d) => {
                    if (d) setEditBirth(d);
                    if (Platform.OS !== "ios") setShowPicker(false);
                  }}
                />
                {Platform.OS === "ios" && (
                  <Pressable style={styles.pickerDone} onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerDoneText}>完成</Text>
                  </Pressable>
                )}
              </View>
            )}
            <View style={styles.editBtnRow}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabled]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <Text style={styles.saveBtnText}>儲存</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditing(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 我的命盤 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>我的命盤</Text>
          {hasBirth ? (
            <>
              <Text style={styles.chartBirth}>
                生日：{user.birth_y}/{pad(user.birth_m!)}/{pad(user.birth_d!)}{" "}
                {pad(user.birth_h!)}時
              </Text>
              <TouchableOpacity style={styles.chartBtn} onPress={viewMyChart}>
                <Text style={styles.chartBtnText}>查看我的命盤</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.chartHint}>
                您尚未設定生日。設定後即可在這裡一鍵查看您的命盤。
              </Text>
              <TouchableOpacity style={styles.chartBtn} onPress={openEdit}>
                <Text style={styles.chartBtnText}>設定生日</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 果實紀錄(最新 5 筆) */}
        <Text style={styles.sectionTitle}>果實紀錄</Text>
        {loading && ledger.length === 0 ? (
          <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />
        ) : ledger.length === 0 ? (
          <Text style={styles.empty}>目前沒有果實異動紀錄</Text>
        ) : (
          ledger.slice(0, 5).map((row, i) => (
            <View key={i} style={styles.ledgerRow}>
              <View style={styles.ledgerLeft}>
                <Text style={styles.ledgerReason}>{reasonText(row.reason)}</Text>
                <Text style={styles.ledgerDate}>{formatDate(row.created_at)}</Text>
              </View>
              <View style={styles.ledgerRight}>
                <Text
                  style={[
                    styles.ledgerDelta,
                    { color: row.delta >= 0 ? colors.shi : colors.moving },
                  ]}
                >
                  {row.delta >= 0 ? `+${row.delta}` : row.delta}
                </Text>
                <Text style={styles.ledgerBalance}>餘 {row.balance_after}</Text>
              </View>
            </View>
          ))
        )}

        {/* 我的紀錄 */}
        <Text style={styles.sectionTitle}>我的紀錄</Text>
        <TouchableOpacity style={styles.acctRow} onPress={toggleHistory}>
          <Text style={styles.acctRowText}>卜卦問事紀錄</Text>
          <Text style={styles.acctRowArrow}>{showHistory ? "▾" : "▸"}</Text>
        </TouchableOpacity>
        {showHistory && (
          <View style={styles.acctBody}>
            {historyLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : history && history.length > 0 ? (
              history.map((q) => (
                <View key={q.id} style={styles.histItem}>
                  <Text style={styles.histQ}>{q.question || "—"}</Text>
                  <Text style={styles.histMeta}>
                    {formatDate(q.created_at)}　{q.ben_gua || "—"}
                    {q.bian_gua ? ` → ${q.bian_gua}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>還沒有紀錄。卜卦並使用 AI 後會留下。</Text>
            )}
          </View>
        )}

        {/* 帳號管理 */}
        <Text style={styles.sectionTitle}>帳號管理</Text>
        <TouchableOpacity style={styles.acctRow} onPress={() => setShowPwd((v) => !v)}>
          <Text style={styles.acctRowText}>修改密碼</Text>
          <Text style={styles.acctRowArrow}>{showPwd ? "▾" : "▸"}</Text>
        </TouchableOpacity>
        {showPwd && (
          <View style={styles.acctBody}>
            <TextInput style={styles.input} value={curPwd} onChangeText={setCurPwd}
              placeholder="目前密碼" placeholderTextColor={colors.subtle}
              secureTextEntry autoCapitalize="none" />
            <TextInput style={[styles.input, { marginTop: spacing.sm }]} value={newPwd} onChangeText={setNewPwd}
              placeholder="新密碼(至少 8 碼,英數混合)" placeholderTextColor={colors.subtle}
              secureTextEntry autoCapitalize="none" />
            <TextInput style={[styles.input, { marginTop: spacing.sm }]} value={newPwd2} onChangeText={setNewPwd2}
              placeholder="再次輸入新密碼" placeholderTextColor={colors.subtle}
              secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={[styles.saveBtn, { marginTop: spacing.md }, pwdBusy && styles.disabled]}
              onPress={doChangePassword} disabled={pwdBusy}>
              {pwdBusy ? <ActivityIndicator color={colors.primaryText} />
                : <Text style={styles.saveBtnText}>更新密碼</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.acctRow} onPress={() => setShowDel((v) => !v)}>
          <Text style={[styles.acctRowText, { color: colors.moving }]}>刪除帳號</Text>
          <Text style={styles.acctRowArrow}>{showDel ? "▾" : "▸"}</Text>
        </TouchableOpacity>
        {showDel && (
          <View style={styles.acctBody}>
            <Text style={styles.delWarn}>
              刪除後將永久移除你的會員資料、剩餘果實與所有紀錄,且無法復原。
            </Text>
            <TextInput style={styles.input} value={delPwd} onChangeText={setDelPwd}
              placeholder="輸入密碼以確認" placeholderTextColor={colors.subtle}
              secureTextEntry autoCapitalize="none" />
            <TouchableOpacity style={[styles.delBtn, { marginTop: spacing.md }, delBusy && styles.disabled]}
              onPress={doDeleteAccount} disabled={delBusy}>
              {delBusy ? <ActivityIndicator color="#fff" />
                : <Text style={styles.delBtnText}>永久刪除我的帳號</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 110 },
  reflectCard: {
    backgroundColor: "#FBF8FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  reflectTitle: { fontSize: 15, fontWeight: "800", color: colors.primary, marginBottom: spacing.sm },
  reflectItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: 12,
    paddingVertical: 6,
    marginTop: spacing.sm,
  },
  reflectFeeling: { fontSize: 13, color: colors.subtle, marginBottom: 4 },
  reflectGoal: { fontSize: 15, color: colors.text, lineHeight: 23 },
  reflectAsk: { fontSize: 13, color: colors.subtle, marginVertical: 6 },
  reflectBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  reflectBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  name: { fontSize: 22, fontWeight: "800", color: colors.text },
  email: { fontSize: 14, color: colors.subtle, marginTop: spacing.xs },
  pointsRow: { alignItems: "center", marginTop: spacing.lg },
  pointsLabel: { fontSize: 13, color: colors.subtle },
  points: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.primary,
    marginTop: spacing.xs,
  },
  editLink: { marginTop: spacing.lg },
  editLinkText: { color: colors.primary, fontSize: 14, fontWeight: "700" },

  editCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  editLabel: {
    fontSize: 13,
    color: colors.subtle,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  genderRow: { flexDirection: "row", gap: spacing.sm },
  genderBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  genderBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderBtnText: { fontSize: 15, color: colors.subtle },
  genderBtnTextOn: { color: colors.primaryText, fontWeight: "700" },
  pickerValue: { fontSize: 16, color: colors.text },
  pickerPlaceholder: { fontSize: 16, color: colors.subtle },
  pickerDone: { alignItems: "flex-end", padding: spacing.sm },
  pickerDoneText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  editBtnRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  saveBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  cancelBtnText: { color: colors.subtle, fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.6 },

  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  chartTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  chartBirth: { fontSize: 14, color: colors.text, marginBottom: spacing.md },
  chartHint: { fontSize: 14, color: colors.subtle, marginBottom: spacing.md, lineHeight: 21 },
  chartBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  chartBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.subtle,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ledgerLeft: { flex: 1 },
  ledgerReason: { fontSize: 15, color: colors.text },
  ledgerDate: { fontSize: 12, color: colors.subtle, marginTop: 2 },
  ledgerRight: { alignItems: "flex-end" },
  ledgerDelta: { fontSize: 17, fontWeight: "700" },
  ledgerBalance: { fontSize: 12, color: colors.subtle, marginTop: 2 },
  acctRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  acctRowText: { fontSize: 15, color: colors.text, fontWeight: "600" },
  acctRowArrow: { fontSize: 14, color: colors.subtle },
  acctBody: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  histItem: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  histQ: { fontSize: 14, color: colors.text },
  histMeta: { fontSize: 12, color: colors.subtle, marginTop: 2 },
  delWarn: { fontSize: 13, color: colors.moving, lineHeight: 20, marginBottom: spacing.md },
  delBtn: {
    backgroundColor: "#a02020",
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  delBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  logoutText: { color: colors.moving, fontSize: 15, fontWeight: "600" },
});
