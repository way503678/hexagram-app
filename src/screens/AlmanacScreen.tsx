import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchAlmanacMonth, ApiError } from "../api";
import { AlmanacDay, AlmanacMonth } from "../types";
import { colors, spacing, zibaiStyle, ganColor, zeriColor } from "../theme";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function AlmanacScreen() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [y, setY] = useState(today.getFullYear());
  const [m, setM] = useState(today.getMonth() + 1);
  const [data, setData] = useState<AlmanacMonth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<AlmanacDay | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchAlmanacMonth(y, m)
      .then((d) => {
        if (alive) {
          setData(d);
          setSel(null);
        }
      })
      .catch((e) => {
        if (alive) setError(e instanceof ApiError ? e.message : "載入失敗");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [y, m]);

  function step(delta: number) {
    let nm = m + delta;
    let ny = y;
    if (nm < 1) {
      nm = 12;
      ny -= 1;
    } else if (nm > 12) {
      nm = 1;
      ny += 1;
    }
    setY(ny);
    setM(nm);
  }

  function goToday() {
    setY(today.getFullYear());
    setM(today.getMonth() + 1);
  }

  const lead = data ? (data.first_weekday + 1) % 7 : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 標題列 */}
        <View style={styles.head}>
          <Text style={styles.title}>
            {y}年{m}月
          </Text>
          <View style={styles.navBtns}>
            <Pressable onPress={() => step(-1)} hitSlop={8} style={styles.navBtn}>
              <Text style={styles.navTxt}>‹</Text>
            </Pressable>
            <Pressable onPress={goToday} hitSlop={8} style={styles.navBtn}>
              <Text style={styles.navToday}>今</Text>
            </Pressable>
            <Pressable onPress={() => step(1)} hitSlop={8} style={styles.navBtn}>
              <Text style={styles.navTxt}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* 節氣摘要 */}
        {data && data.jieqi.length > 0 && (
          <Text style={styles.jq}>
            {data.jieqi.map((j) => `${j.name} ${j.day}日 ${j.time ?? ""}`).join("　")}
          </Text>
        )}

        {/* 星期列 */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={w} style={[styles.weekCell, i === 0 && styles.sunText]}>
              {w}
            </Text>
          ))}
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* 月曆格 */}
        {data && !loading && (
          <View style={styles.grid}>
            {Array.from({ length: lead }).map((_, i) => (
              <View key={`e${i}`} style={styles.cell} />
            ))}
            {data.days.map((day, idx) => {
              const col = (idx + lead) % 7;
              const isToday = day.solar === todayStr;
              const zb = zibaiStyle[day.day_zibai];
              return (
                <Pressable
                  key={day.solar}
                  style={[styles.cell, sel?.solar === day.solar && styles.cellSel]}
                  onPress={() => setSel(day)}
                >
                  <View style={styles.cellTop}>
                    <View style={[styles.dnumWrap, isToday && styles.todayWrap]}>
                      <Text style={[styles.dnum, col === 0 && styles.sunText, isToday && styles.todayNum]}>
                        {parseInt(day.solar.slice(8, 10), 10)}
                      </Text>
                    </View>
                    <Text style={[styles.gz, { color: ganColor(day.day_gz[0]) }]}>{day.day_gz}</Text>
                  </View>
                  <Text style={styles.lunar} numberOfLines={1}>
                    {day.jieqi ? <Text style={styles.jqInCell}>{day.jieqi}</Text> : day.lunar_label}
                  </Text>
                  <View style={styles.cellBottom}>
                    <View
                      style={[
                        styles.zb,
                        { backgroundColor: zb.bg },
                        zb.border && styles.zbBorder,
                      ]}
                    >
                      <Text style={[styles.zbTxt, { color: zb.fg }]}>{day.day_zibai_name}</Text>
                    </View>
                    {day.擇日 && (
                      <Text
                        style={[
                          styles.jx,
                          { color: zeriColor[day.擇日.吉凶] || colors.subtle },
                        ]}
                        numberOfLines={1}
                      >
                        {day.擇日.建除}·{day.擇日.吉凶}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 本月重要日子 */}
        {data && !loading && (
          <View style={styles.keyWrap}>
            <Text style={styles.keyTitle}>本月重要日子</Text>
            {(["大吉", "大凶"] as const).map((lv) => {
              const list = data.days.filter((d) => d.擇日 && d.擇日.吉凶 === lv);
              return (
                <View key={lv} style={styles.keyGrp}>
                  <Text style={[styles.keyTag, { backgroundColor: zeriColor[lv] }]}>{lv}</Text>
                  {list.length === 0 ? (
                    <Text style={styles.keyNone}>本月無{lv}日</Text>
                  ) : (
                    list.map((d) => (
                      <Pressable key={d.solar} onPress={() => setSel(d)} style={styles.keyRow}>
                        <Text style={styles.keyDate}>{m}/{parseInt(d.solar.slice(8, 10), 10)}</Text>
                        <Text style={styles.keyText} numberOfLines={2}>
                          {d.day_gz}日·{d.擇日!.建除} — {d.擇日!.宜忌}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 選取日詳情 */}
        {sel && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>
              {sel.solar.slice(0, 4)}年{parseInt(sel.solar.slice(5, 7), 10)}月{parseInt(sel.solar.slice(8, 10), 10)}日（{WEEKDAYS[(sel.weekday + 1) % 7]}）
            </Text>
            <DetailRow label="農曆" value={`${sel.lunar_month_cn}${sel.lunar_day_cn}`} />
            <DetailRow label="干支" value={`${sel.year_gz}年 ${sel.month_gz}月 ${sel.day_gz}日`} />
            <DetailRow label="生肖" value={sel.shengxiao} />
            {sel.jieqi && <DetailRow label="節氣" value={`${sel.jieqi} ${sel.jieqi_time ?? ""}`} />}
            <DetailRow label="日紫白" value={sel.day_zibai_name} />
            <DetailRow label="年紫白" value={sel.year_zibai.name} />
            {sel.擇日 && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.zeriHead}>
                  <Text style={styles.zeriTitle}>董公擇日</Text>
                  <Text
                    style={[styles.zeriBadge, { backgroundColor: zeriColor[sel.擇日.吉凶] || colors.subtle }]}
                  >
                    {sel.擇日.吉凶}
                  </Text>
                </View>
                <Text style={styles.baihua}>{sel.擇日.白話}</Text>
                <View style={styles.yjRow}>
                  <Text style={[styles.yjTag, styles.yiTag]}>宜</Text>
                  <Text style={styles.yjText}>{sel.擇日.宜.join("、")}</Text>
                </View>
                <View style={styles.yjRow}>
                  <Text style={[styles.yjTag, styles.jiTag]}>忌</Text>
                  <Text style={styles.yjText}>{sel.擇日.忌.join("、")}</Text>
                </View>
                <DetailRow label="建除" value={`${sel.擇日.建除}日`} />
                <DetailRow label="正沖" value={`生肖屬${sel.擇日.正沖生肖}`} />
                <DetailRow label="三煞" value={sel.擇日.三煞註} />
                <Text style={styles.zeriNote}>
                  ※ 擇日吉凶為傳統神煞推算之參考,請斟酌使用。
                </Text>
              </>
            )}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "800", color: colors.primary },
  navBtns: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  navBtn: { paddingHorizontal: spacing.sm },
  navTxt: { fontSize: 26, color: colors.primary, fontWeight: "700" },
  navToday: { fontSize: 16, color: colors.primary, fontWeight: "700" },
  jq: { color: "#7a3b9e", fontSize: 13, marginTop: 2, marginBottom: spacing.sm },
  weekRow: { flexDirection: "row" },
  weekCell: { width: `${100 / 7}%`, textAlign: "center", color: colors.subtle, fontSize: 14, fontWeight: "700", paddingVertical: 5 },
  sunText: { color: "#c0392b" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 62,
    padding: 2,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cellSel: { backgroundColor: "#f3eaf8" },
  cellTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dnumWrap: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  todayWrap: { backgroundColor: "#333", borderRadius: 12 },
  dnum: { fontSize: 16, fontWeight: "800", color: "#333" },
  todayNum: { color: "#fff" },
  gz: { fontSize: 13, lineHeight: 14, width: 15, textAlign: "center", fontWeight: "700" },
  lunar: { fontSize: 11, color: colors.subtle, marginTop: 1, fontWeight: "600" },
  jqInCell: { color: "#7a3b9e", fontWeight: "700" },
  cellBottom: { marginTop: 2, flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  zb: { alignSelf: "flex-start", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  zbBorder: { borderWidth: 0.5, borderColor: "#bbb" },
  zbTxt: { fontSize: 13, fontWeight: "800" },
  jx: { fontSize: 9.5, fontWeight: "700", marginLeft: 2 },
  detail: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  detailTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  detailRow: { flexDirection: "row", paddingVertical: 3 },
  detailLabel: { width: 72, color: colors.subtle, fontSize: 13 },
  detailValue: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  detailDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  zeriHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  zeriTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  zeriBadge: { color: "#fff", fontSize: 12, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 1, borderRadius: 4, overflow: "hidden" },
  zeriNote: { marginTop: spacing.sm, fontSize: 11, color: colors.subtle, lineHeight: 16 },
  baihua: {
    backgroundColor: "#f6f1e8",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  yjRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 3 },
  yjTag: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    width: 22,
    height: 22,
    lineHeight: 22,
    textAlign: "center",
    borderRadius: 4,
    marginRight: spacing.sm,
    overflow: "hidden",
  },
  yiTag: { backgroundColor: "#2e7d32" },
  jiTag: { backgroundColor: "#c0392b" },
  yjText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 22 },
  error: { marginTop: spacing.lg, color: colors.moving, textAlign: "center" },
  keyWrap: { marginTop: spacing.lg },
  keyTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  keyGrp: { marginBottom: spacing.md },
  keyTag: {
    alignSelf: "flex-start",
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  keyNone: { color: colors.subtle, fontSize: 13 },
  keyRow: { flexDirection: "row", paddingVertical: 3 },
  keyDate: { width: 48, fontWeight: "700", color: colors.text, fontSize: 13 },
  keyText: { flex: 1, color: colors.subtle, fontSize: 13, lineHeight: 19 },
});
