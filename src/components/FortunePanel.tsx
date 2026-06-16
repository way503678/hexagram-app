import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fetchFortune, ApiError } from "../api";
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
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchFortune(birth, gender, year)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "流年載入失敗"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [birth.y, birth.m, birth.d, birth.h, gender, year]);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>流年</Text>
        <View style={styles.yearNav}>
          <Pressable onPress={() => setYear((v) => v - 1)} hitSlop={8}>
            <Text style={styles.navTxt}>‹</Text>
          </Pressable>
          <Text style={styles.yearTxt}>{year}</Text>
          <Pressable onPress={() => setYear((v) => v + 1)} hitSlop={8}>
            <Text style={styles.navTxt}>›</Text>
          </Pressable>
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {error && <Text style={styles.error}>{error}</Text>}

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

          {/* 流年斷語 */}
          {data.斷語.流年.map((rm, i) => (
            <Remark key={i} rm={rm} />
          ))}

          {/* 流年六爻表 */}
          <View style={styles.card}>
            <Text style={styles.tableTitle}>流年對六爻</Text>
            <YaoTable rows={data.流年.對六爻} />
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
                    <YaoTable rows={mo.對六爻} />
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

function YaoTable({ rows }: { rows: FortuneYaoRow[] }) {
  const ordered = [...rows].sort((a, b) => rowIdx(b) - rowIdx(a)); // 上→初
  return (
    <View>
      <View style={[styles.tr, styles.thead]}>
        <Text style={[styles.th, styles.cPos]}>爻</Text>
        <Text style={[styles.th, styles.cRel]}>六親</Text>
        <Text style={[styles.th, styles.cGz]}>干支</Text>
        <Text style={[styles.th, styles.cRel2]}>生剋/合沖</Text>
      </View>
      {ordered.map((r, i) => {
        const relColor = wuxingColor[r.五行] || colors.text;
        const sk = [r.生剋, r.合沖, r.當值].filter(Boolean).join("·");
        return (
          <View key={i} style={[styles.tr, r.動爻 && styles.trMoving]}>
            <Text style={[styles.td, styles.cPos]}>
              {r.爻序名}
              {r.世 ? <Text style={{ color: colors.shi }}> 世</Text> : null}
              {r.應 ? <Text style={{ color: colors.ying }}> 應</Text> : null}
            </Text>
            <Text style={[styles.td, styles.cRel, { color: relColor }]}>{r.六親}</Text>
            <Text style={[styles.td, styles.cGz]}>{r.干支}</Text>
            <Text style={[styles.td, styles.cRel2]}>{sk || "—"}</Text>
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
  cRel: { width: 44 },
  cGz: { width: 52 },
  cRel2: { flex: 1, textAlign: "right" },
  error: { color: colors.moving, textAlign: "center", marginVertical: spacing.md },
});
