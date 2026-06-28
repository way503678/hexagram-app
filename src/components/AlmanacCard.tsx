/**
 * 命果 MINGO 今日黃曆卡(卡片式,非傳統農民曆)。
 * 能量★ / 元素 / 今日適合(宜) / 避免(忌) / 一句話,可展開看更多(沖煞/神煞)。
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlmanacDay } from "../types";
import { SectionCard } from "./ui";
import { colors, spacing, wuxingColor } from "../theme";

const GAN_WX: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const STAR: Record<string, number> = { 大吉: 5, 吉: 4, 小吉: 4, 平: 3, 凶: 2, 大凶: 1 };

function stars(n: number) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export default function AlmanacCard({ day }: { day: AlmanacDay }) {
  const [open, setOpen] = useState(false);
  const z = day.擇日;
  const element = GAN_WX[(day.day_gz || "").charAt(0)] || "—";
  const energy = z ? STAR[z.吉凶] ?? 3 : 3;
  const suit = z?.宜 || [];
  const avoid = z?.忌 || [];

  return (
    <SectionCard style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>今日黃曆</Text>
        <Text style={styles.date}>
          {day.lunar_month_cn}
          {day.lunar_day_cn}・{day.day_gz}日
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>今日能量</Text>
          <Text style={styles.stars}>{stars(energy)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>今日元素</Text>
          <Text style={[styles.element, { color: wuxingColor[element] || colors.text }]}>{element}</Text>
        </View>
      </View>

      {suit.length > 0 && (
        <View style={styles.line}>
          <Text style={styles.lineLabel}>今日適合</Text>
          <Text style={styles.suitText}>✔ {suit.slice(0, 4).join("　✔ ")}</Text>
        </View>
      )}
      {avoid.length > 0 && (
        <View style={styles.line}>
          <Text style={styles.lineLabel}>盡量避免</Text>
          <Text style={styles.avoidText}>✘ {avoid.slice(0, 4).join("　✘ ")}</Text>
        </View>
      )}

      {z?.白話 ? <Text style={styles.plain}>{z.白話}</Text> : null}

      {z && (
        <>
          <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8} style={styles.moreBtn}>
            <Text style={styles.moreTxt}>{open ? "▾ 收起" : "▸ 更多(沖煞・神煞)"}</Text>
          </Pressable>
          {open && (
            <View style={styles.more}>
              <Text style={styles.moreLine}>正沖生肖:{z.正沖生肖}　三煞方位:{z.三煞方位}</Text>
              {z.神煞?.length > 0 && (
                <Text style={styles.moreLine}>神煞:{z.神煞.join("、")}</Text>
              )}
            </View>
          )}
        </>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {},
  head: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, letterSpacing: 1 },
  date: { fontSize: 13, color: colors.subtle },
  row: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.md },
  metric: { flex: 1 },
  metricLabel: { fontSize: 12, color: colors.subtle, marginBottom: 4 },
  stars: { fontSize: 18, color: colors.gold, letterSpacing: 2 },
  element: { fontSize: 22, fontWeight: "800" },
  line: { flexDirection: "row", marginBottom: 6 },
  lineLabel: { fontSize: 13, color: colors.subtle, width: 64 },
  suitText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 22 },
  avoidText: { flex: 1, fontSize: 14, color: "#a06a6a", lineHeight: 22 },
  plain: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 23,
    marginTop: spacing.sm,
    backgroundColor: "#F3F1F8",
    borderRadius: 12,
    padding: 12,
  },
  moreBtn: { marginTop: spacing.sm },
  moreTxt: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  more: { marginTop: 6 },
  moreLine: { fontSize: 13, color: colors.subtle, lineHeight: 21 },
});
