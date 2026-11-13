import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useClipboardFeedback } from "../hooks/useClipboardFeedback";
import CopyFeedback from "./CopyFeedback";
import MingoReading from "./MingoReading";
import { fetchFortuneAccess, unlockFortune, FortuneAccess, ApiError } from "../api";
import { useAuth } from "../AuthContext";
import { FortuneResult, FortuneRemark, FortuneYaoRow, DominantYao } from "../types";
import { colors, spacing, wuxingColor } from "../theme";

interface Props {
  birth: { y: number; m: number; d: number; h: number };
  gender: "M" | "F" | "";
}

const LEVEL_COLOR: Record<string, string> = {
  吉: "#2e7d32",
  凶: "#c0392b",
  警: "#c97a14",
  中: "#2c5d8a",
};

export default function FortunePanel({ birth, gender }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 390 || fontScale > 1.1;
  const { user, refresh } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [access, setAccess] = useState<FortuneAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const identity = `${user?.id}:${birth.y}:${birth.m}:${birth.d}:${birth.h}:${gender}:${year}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const alive = useRef(true);
  const busyRef = useRef(false);
  const accessVersion = useRef(0);
  const { copy, feedback, copied, reset: resetCopyFeedback } = useClipboardFeedback();
  const data = access?.fortune;
  const balance = access?.balance ?? user?.points_balance ?? 0;
  const cost = access?.cost ?? 2;
  const insufficient = !access?.unlocked && balance < cost;

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  // 只查詢已購資格與保存內容；換年份、重開畫面均不會觸發扣款。
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") { clearTimeout(timer); void load(); }
    });
    async function load() {
      if (busyRef.current) return;
      const version = ++accessVersion.current;
      try {
        const result = await fetchFortuneAccess(birth, gender, year);
        if (!active || version !== accessVersion.current) return;
        setAccess(result);
        setError(null);
        if (result.pending) timer = setTimeout(load, 5000);
      } catch (e) {
        if (active && version === accessVersion.current) setError(e instanceof Error ? e.message : "流年載入失敗");
      } finally {
        if (active && version === accessVersion.current) setLoading(false);
      }
    }
    setAccess(null);
    setOpenMonth(null);
    setError(null);
    setLoading(true);
    resetCopyFeedback();
    void load();
    return () => { active = false; clearTimeout(timer); subscription.remove(); };
  }, [identity, retry, user?.points_balance]);

  async function unlock() {
    if (busyRef.current || insufficient || !access || access.pending) return;
    busyRef.current = true;
    accessVersion.current += 1;
    setBusy(true);
    setError(null);
    const requestedIdentity = identity;
    try {
      const result = await unlockFortune(birth, gender, year);
      if (alive.current && identityRef.current === requestedIdentity) setAccess(result);
    } catch (e) {
      // 回應遺失時先查保存狀態，重試不會購買第二次。
      if (alive.current && identityRef.current === requestedIdentity) {
        try {
          const result = await fetchFortuneAccess(birth, gender, year);
          if (alive.current && identityRef.current === requestedIdentity) {
            setAccess(result);
            if (result.pending) setRetry((n) => n + 1);
            if (!result.ready && !result.pending) setError(e instanceof ApiError ? e.message : "流年產生失敗，請稍後再試");
          }
        } catch {
          if (alive.current && identityRef.current === requestedIdentity) {
            setAccess(null);
            setError("連線中斷，請重新整理確認解鎖狀態。");
          }
        }
      }
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
      await refresh();
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>流年</Text>
        <View style={styles.yearNav}>
          <Pressable disabled={busy || access?.pending || year <= 1900} onPress={() => setYear((v) => v - 1)} hitSlop={8}>
            <Text style={styles.navTxt}>‹</Text>
          </Pressable>
          <Text style={styles.yearTxt}>{year}</Text>
          <Pressable disabled={busy || access?.pending || year >= 2100} onPress={() => setYear((v) => v + 1)} hitSlop={8}>
            <Text style={styles.navTxt}>›</Text>
          </Pressable>
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {error && !loading && <TouchableOpacity onPress={() => setRetry((n) => n + 1)}><Text style={styles.copyBtnText}>重新整理</Text></TouchableOpacity>}
      {access && !access.ready && !loading && (
        <View style={[styles.card, styles.unlockCard]}>
          <Text style={styles.unlockTitle}>{access.unlocked ? "這份流年已解鎖" : `${year} 年，留一點時間給自己`}</Text>
          <Text style={styles.unlockIntro}>一次解鎖完整流年、12 個流月與 AI 生活建議。</Text>
          <Text style={styles.unlockTerms}>相同出生資料、性別與年份，重看不再扣果實。更換資料或年份需另行解鎖。</Text>
          <Text style={styles.unlockBalance}>目前有 {balance} 顆果實{access.unlocked ? " · 本次不扣果實" : ` · 解鎖需要 ${cost} 顆`}</Text>
          <TouchableOpacity
            testID="fortune-unlock"
            style={[styles.adviceBtn, styles.unlockButton, (busy || insufficient || access.pending) && styles.adviceBtnBusy]}
            disabled={busy || insufficient || access.pending}
            onPress={unlock}
          >
            {busy || access.pending ? <ActivityIndicator color={colors.primaryText} /> : null}
            <Text style={styles.adviceBtnText}>{busy || access.pending ? "正在準備你的流年與 AI 解讀…" : access.unlocked ? "重新產生已解鎖流年（不扣果實）" : `解鎖完整流年（${cost} 顆果實）`}</Text>
          </TouchableOpacity>
          {(busy || access.pending) && <Text accessibilityRole="alert" style={styles.unlockNote}>正在準備解讀，請勿跳出 App 或離開此畫面。</Text>}
          {insufficient && <Text style={styles.error}>果實不足，請至「我的」查看餘額。新註冊完成 Email 驗證可領取 2 顆。</Text>}
          <Text style={styles.unlockNote}>AI 解讀保存 30 天。到期後，這份已解鎖的流年可免費重新產生。</Text>
        </View>
      )}

      {data && !loading && (
        <>
          {/* 流年摘要 */}
          <View style={styles.card}>
            <Text style={styles.guaName}>
              {year}　{data.流年.干支}
              <Text style={styles.wx}>（{data.流年.五行}）</Text>
            </Text>
            <Text style={styles.sub}>
              對世爻:{data.流年.對世爻}
              {data.流年.對世爻合沖 ? ` · ${data.流年.對世爻合沖}` : ""}
            </Text>
            {data.流年.主導爻.length > 0 && (
              <Text style={styles.sub}>
                當令:{data.流年.主導爻.map((r) => `${r.六親}${r.地支}(${r.當值})`).join("、")}
              </Text>
            )}
          </View>

          <View style={styles.adviceWrap}>
            <Text style={styles.tableTitle}>命果 AI · 今年的生活建議</Text>
            {access?.reading && <MingoReading text={access.reading.replace(/^#{1,6}\s+(.+)$/gm, "【$1】")} />}
            <Text style={styles.adviceHint}>已解鎖 · 同份重看不扣果實{access?.saved_until ? ` · AI 保存至 ${new Date(access.saved_until).toLocaleDateString("zh-TW")}` : ""}</Text>
            {!!access?.prompt && <TouchableOpacity style={styles.copyBtn} onPress={() => copy(access.prompt!)}>
              <Text style={styles.copyBtnText}>{copied ? "✓ 已複製" : "複製 AI Prompt（免費）"}</Text>
            </TouchableOpacity>}
            <CopyFeedback feedback={feedback} />
          </View>

          {/* 流年斷語 */}
          {data.斷語.流年.map((rm, i) => (
            <Remark key={i} rm={rm} />
          ))}

          {/* 流年六爻表 */}
          <View style={styles.card}>
            <Text style={styles.tableTitle}>流年對六爻</Text>
            <YaoTable rows={data.流年.對六爻} compact={compact} />
          </View>

          {/* 流月 */}
          <Text style={styles.monthsHdr}>流月（12 個月）</Text>
          {data.流月.map((mo) => {
            const open = openMonth === mo.月名;
            const remarks = data.斷語.流月[mo.月名] || [];
            return (
              <View key={mo.月序} style={styles.monthCard}>
                <Pressable
                  style={styles.monthHead}
                  onPress={() => setOpenMonth(open ? null : mo.月名)}
                >
                  <Text style={styles.monthName}>
                    {mo.月名}　<Text style={styles.monthRange}>國曆 {mo.區間}</Text>
                  </Text>
                  <Text style={styles.monthMeta}>
                    {mo.干支} · 對世爻 {mo.對世爻}
                    {mo.對世爻合沖 ? `/${mo.對世爻合沖}` : ""}　{open ? "▾" : "▸"}
                  </Text>
                </Pressable>
                {open && (
                  <View style={styles.monthBody}>
                    {remarks.map((rm, i) => (
                      <Remark key={i} rm={rm} compact />
                    ))}
                    <YaoTable rows={mo.對六爻} compact={compact} />
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

function Remark({ rm, compact }: { rm: FortuneRemark; compact?: boolean }) {
  const c = LEVEL_COLOR[rm.level] || colors.subtle;
  return (
    <View style={[styles.remark, { borderLeftColor: c }, compact && styles.remarkCompact]}>
      <Text style={styles.remarkText}>
        <Text style={[styles.remarkTag, { color: c }]}>{rm.level}　</Text>
        {rm.text}
      </Text>
      {rm.sub?.map((s, i) => (
        <Text key={i} style={styles.remarkSub}>
          ・{s.label ? `${s.label}:` : ""}
          {s.text}
        </Text>
      ))}
    </View>
  );
}

function YaoTable({ rows, compact = false }: { rows: FortuneYaoRow[]; compact?: boolean }) {
  const ordered = [...rows].sort((a, b) => rowIdx(b) - rowIdx(a)); // 上→初
  return (
    <View>
      <View style={[styles.tr, styles.thead]}>
        <Text style={[styles.th, styles.cPos, compact && styles.cPosCompact]}>爻</Text>
        <Text style={[styles.th, styles.cRel, compact && styles.cRelCompact]}>六親</Text>
        <Text style={[styles.th, styles.cGz, compact && styles.cGzCompact]}>干支</Text>
        <Text style={[styles.th, styles.cRel2]}>生剋/合沖</Text>
      </View>
      {ordered.map((r, i) => {
        const relColor = wuxingColor[r.五行] || colors.text;
        const sk = [r.生剋, r.合沖, r.當值].filter(Boolean).join("·");
        return (
          <View key={i} style={[styles.tr, r.動爻 && styles.trMoving]}>
            <Text style={[styles.td, styles.cPos, compact && styles.cPosCompact]} numberOfLines={1} adjustsFontSizeToFit>
              {r.爻序名}
              {r.世 ? <Text style={{ color: colors.shi }}> 世</Text> : null}
              {r.應 ? <Text style={{ color: colors.ying }}> 應</Text> : null}
            </Text>
            <Text style={[styles.td, styles.cRel, compact && styles.cRelCompact, { color: relColor }]} numberOfLines={1} adjustsFontSizeToFit>{r.六親}</Text>
            <Text style={[styles.td, styles.cGz, compact && styles.cGzCompact]} numberOfLines={1} adjustsFontSizeToFit>{r.干支}</Text>
            <Text style={[styles.td, styles.cRel2]} numberOfLines={2}>{sk || "—"}</Text>
          </View>
        );
      })}
    </View>
  );
}

function rowIdx(r: FortuneYaoRow): number {
  // 對六爻 rows 由 index/爻序index 排序;用爻序名對照初~上
  const order = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
  return order.indexOf(r.爻序名);
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  yearNav: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  navTxt: { fontSize: 24, color: colors.primary, fontWeight: "700" },
  yearTxt: { fontSize: 18, fontWeight: "700", color: colors.text, minWidth: 56, textAlign: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  guaName: { fontSize: 19, fontWeight: "700", color: colors.text },
  wx: { fontSize: 14, color: colors.subtle, fontWeight: "400" },
  sub: { marginTop: spacing.xs, color: colors.subtle, fontSize: 14 },
  unlockCard: { padding: spacing.md },
  unlockTitle: { fontSize: 17, lineHeight: 26, fontWeight: "700", color: colors.text, marginBottom: 12 },
  unlockIntro: { fontSize: 14, lineHeight: 23, color: colors.text },
  unlockTerms: { fontSize: 13, lineHeight: 22, color: colors.subtle, marginTop: 12 },
  unlockBalance: { fontSize: 14, lineHeight: 23, color: colors.primary, fontWeight: "600", marginVertical: 16 },
  unlockButton: { paddingHorizontal: 12 },
  unlockNote: { fontSize: 13, lineHeight: 22, color: colors.subtle, marginTop: 16 },
  remark: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  remarkCompact: { marginBottom: 6 },
  remarkText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  remarkTag: { fontWeight: "800" },
  remarkSub: { color: colors.subtle, fontSize: 13, marginTop: 3, lineHeight: 19 },
  tableTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  monthsHdr: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  monthCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  monthHead: { padding: spacing.md },
  monthName: { fontSize: 15, fontWeight: "700", color: colors.text },
  monthRange: { fontSize: 13, fontWeight: "400", color: colors.subtle },
  monthMeta: { marginTop: 2, fontSize: 13, color: colors.subtle },
  monthBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  tr: { flexDirection: "row", alignItems: "center", paddingVertical: 5, borderTopWidth: 1, borderTopColor: colors.border },
  thead: { borderTopWidth: 0 },
  trMoving: { backgroundColor: "#fbeeee" },
  th: { fontSize: 11, fontWeight: "700", color: colors.subtle },
  td: { fontSize: 13, color: colors.text },
  cPos: { width: 66 },
  cPosCompact: { width: 52 },
  cRel: { width: 44 },
  cRelCompact: { width: 38 },
  cGz: { width: 52 },
  cGzCompact: { width: 44 },
  cRel2: { flex: 1, textAlign: "right" },
  error: { color: colors.moving, textAlign: "center", marginVertical: spacing.md },
  adviceWrap: { marginBottom: spacing.md },
  adviceBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  adviceBtnBusy: { opacity: 0.6 },
  adviceBtnText: { color: colors.primaryText, fontSize: 15, lineHeight: 23, textAlign: "center", fontWeight: "700" },
  adviceBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
  },
  adviceHint: { fontSize: 12, color: colors.subtle, lineHeight: 18, marginBottom: spacing.sm },
  adviceContent: { fontSize: 13, color: colors.text, lineHeight: 20 },
  copyBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  copyBtnText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
});
