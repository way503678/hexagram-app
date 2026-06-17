import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { useAuth } from "../AuthContext";
import { fetchLedger, testTopup, LedgerEntry, ApiError } from "../api";

/** 帳本 reason 轉中文。 */
const REASON_LABEL: Record<string, string> = {
  welcome_bonus: "新會員贈點",
  test_topup: "測試儲值",
  divination: "AI 解盤扣點",
  prompt: "AI Prompt 產生",
  refund: "解盤失敗退點",
};

function reasonText(reason: string): string {
  return REASON_LABEL[reason] || reason;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export default function MemberScreen() {
  const { user, logout, refresh, setUser } = useAuth();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
      const { ledger: rows } = await fetchLedger();
      setLedger(rows);
    } catch {
      /* 讀取失敗就維持原狀,下拉可重試 */
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  async function onTopup() {
    if (busy) return;
    setBusy(true);
    try {
      const { balance } = await testTopup();
      if (user) setUser({ ...user, points_balance: balance });
      const { ledger: rows } = await fetchLedger();
      setLedger(rows);
    } catch (e) {
      Alert.alert("加點失敗", e instanceof ApiError ? e.message : "請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    Alert.alert("登出", "確定要登出嗎?", [
      { text: "取消", style: "cancel" },
      { text: "登出", style: "destructive", onPress: () => logout() },
    ]);
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        {/* 會員卡 */}
        <View style={styles.card}>
          <Text style={styles.name}>{user.display_name || "會員"}</Text>
          {!!user.email && <Text style={styles.email}>{user.email}</Text>}
          <View style={styles.pointsRow}>
            <Text style={styles.pointsLabel}>剩餘點數</Text>
            <Text style={styles.points}>{user.points_balance}</Text>
          </View>
        </View>

        {/* 測試加點(綠界串好後移除) */}
        <TouchableOpacity
          style={[styles.topupBtn, busy && styles.disabled]}
          onPress={onTopup}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.topupText}>＋ 測試加 10 點</Text>
          )}
        </TouchableOpacity>

        {/* 點數紀錄 */}
        <Text style={styles.sectionTitle}>點數紀錄</Text>
        {loading && ledger.length === 0 ? (
          <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />
        ) : ledger.length === 0 ? (
          <Text style={styles.empty}>目前沒有點數異動紀錄</Text>
        ) : (
          ledger.map((row, i) => (
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

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
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
  topupBtn: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  topupText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.6 },
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
  logoutBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  logoutText: { color: colors.moving, fontSize: 15, fontWeight: "600" },
});
