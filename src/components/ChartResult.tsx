import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChartResponse, LiuYaoEntry } from "../types";
import { colors, spacing, wuxingColor } from "../theme";

interface Props {
  chart: ChartResponse;
}

/** 把「對六爻」由 初→上 反轉成 上→初(傳統由上而下呈現)。 */
function topDown(entries: LiuYaoEntry[]): LiuYaoEntry[] {
  return [...entries].sort((a, b) => b.index - a.index);
}

export default function ChartResult({ chart }: Props) {
  const inner = chart.卦象;
  const ben = inner.本卦;
  const bian = inner.變卦;
  const rows = topDown(chart.對六爻);

  return (
    <View style={styles.wrap}>
      {/* 卦名標題 */}
      <View style={styles.card}>
        <Text style={styles.guaName}>
          {ben.卦名}
          {bian ? <Text style={styles.arrow}>　→　{bian.卦名}</Text> : null}
        </Text>
        <Text style={styles.guaSub}>
          {ben.卦宮}宮 · {ben.卦變} · 世爻五行 {ben.世爻五行}
        </Text>
        <Text style={styles.guaCi}>{ben.卦辭}</Text>
      </View>

      {/* 排盤資訊 */}
      <View style={styles.card}>
        <InfoRow label="排盤時間" value={chart.排盤時間} />
        <InfoRow
          label="四柱"
          value={`${inner.四柱.年} ${inner.四柱.月} ${inner.四柱.日} ${inner.四柱.時}`}
        />
        <InfoRow label="日干支 / 時辰" value={`${inner.日干支} · ${inner.時辰}`} />
        <InfoRow label="動爻" value={inner.動爻.描述 || "無(靜卦)"} />
        <InfoRow
          label="旬空"
          value={chart.旬空.length ? chart.旬空.join("、") : "無"}
        />
      </View>

      {/* 六爻表 */}
      <View style={styles.card}>
        <Text style={styles.tableTitle}>六爻</Text>
        <View style={[styles.tr, styles.thead]}>
          <Text style={[styles.th, styles.colPos]}>爻</Text>
          <Text style={[styles.th, styles.colSix]}>六神</Text>
          <Text style={[styles.th, styles.colRel]}>六親</Text>
          <Text style={[styles.th, styles.colGz]}>干支</Text>
          <Text style={[styles.th, styles.colState]}>旺衰</Text>
        </View>
        {rows.map((e) => (
          <YaoRow key={e.index} e={e} />
        ))}
        <Text style={styles.legend}>
          ● 世/應　<Text style={{ color: colors.moving }}>紅=動爻</Text>　空=旬空
        </Text>
      </View>
    </View>
  );
}

function YaoRow({ e }: { e: LiuYaoEntry }) {
  const relColor = wuxingColor[e.五行] || colors.text;
  const state = [e.當值, e.生剋].filter(Boolean).join(" / ") || "—";
  return (
    <View style={[styles.tr, e.動爻 && styles.trMoving]}>
      <Text style={[styles.td, styles.colPos]}>
        {e.爻序名}
        {e.世 ? <Text style={[styles.tag, { color: colors.shi }]}> 世</Text> : null}
        {e.應 ? <Text style={[styles.tag, { color: colors.ying }]}> 應</Text> : null}
      </Text>
      <Text style={[styles.td, styles.colSix]}>{e.六神}</Text>
      <Text style={[styles.td, styles.colRel, { color: relColor }]}>
        {e.六親}
        <Text style={styles.wx}> {e.五行}</Text>
      </Text>
      <Text style={[styles.td, styles.colGz]}>
        {e.干支}
        {e.空亡 ? <Text style={styles.kong}> 空</Text> : null}
        {e.動爻 ? <Text style={{ color: colors.moving }}> 動</Text> : null}
      </Text>
      <Text style={[styles.td, styles.colState]}>{state}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  guaName: { fontSize: 22, fontWeight: "700", color: colors.text },
  arrow: { fontSize: 18, color: colors.subtle, fontWeight: "400" },
  guaSub: { marginTop: spacing.xs, color: colors.subtle, fontSize: 13 },
  guaCi: { marginTop: spacing.sm, color: colors.text, lineHeight: 22 },
  infoRow: { flexDirection: "row", paddingVertical: 3 },
  infoLabel: { width: 96, color: colors.subtle, fontSize: 13 },
  infoValue: { flex: 1, color: colors.text, fontSize: 14 },
  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  thead: { borderTopWidth: 0 },
  trMoving: { backgroundColor: "#fbeeee" },
  th: { fontSize: 12, fontWeight: "700", color: colors.subtle },
  td: { fontSize: 13, color: colors.text },
  colPos: { width: 64 },
  colSix: { width: 44 },
  colRel: { width: 64 },
  colGz: { flex: 1 },
  colState: { width: 92, textAlign: "right" },
  tag: { fontSize: 12, fontWeight: "700" },
  wx: { fontSize: 11, color: colors.subtle },
  kong: { color: colors.accent, fontWeight: "700" },
  legend: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.subtle,
  },
});
