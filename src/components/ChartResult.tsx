import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChartResponse, LiuYaoEntry, Yao } from "../types";
import { colors, spacing, wuxingColor } from "../theme";

interface Props {
  chart: ChartResponse;
}

/** 由 初→上 反轉成 上→初(傳統由上而下呈現)。 */
function topDown<T extends { index?: number; 爻序index?: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const ai = a.index ?? a.爻序index ?? 0;
    const bi = b.index ?? b.爻序index ?? 0;
    return bi - ai;
  });
}

export default function ChartResult({ chart }: Props) {
  const inner = chart.卦象;
  const ben = inner.本卦;
  const bian = inner.變卦;
  const rows = topDown(chart.對六爻);

  // 本卦各爻(查神煞/爻象用),以 爻序index 建索引
  const benByIndex = new Map<number, Yao>();
  ben.爻.forEach((y) => benByIndex.set(y.爻序index, y));

  return (
    <View style={styles.wrap}>
      {/* 卦名 */}
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
        {!!inner.農曆 && <InfoRow label="農曆" value={inner.農曆} />}
        <InfoRow
          label="四柱"
          value={`${inner.四柱.年} ${inner.四柱.月} ${inner.四柱.日} ${inner.四柱.時}`}
        />
        <InfoRow label="日干支 / 時辰" value={`${inner.日干支} · ${inner.時辰}`} />
        <InfoRow label="動爻" value={inner.動爻.描述 || "無(靜卦)"} />
        <InfoRow label="旬空" value={chart.旬空.length ? chart.旬空.join("、") : "無"} />
      </View>

      {/* 六爻 */}
      <View style={styles.card}>
        <Text style={styles.tableTitle}>六爻(本卦)</Text>
        {rows.map((e) => (
          <YaoRow key={e.index} e={e} ben={benByIndex.get(e.index)} />
        ))}
        <Text style={styles.legend}>
          世/應 · <Text style={{ color: colors.moving }}>紅=動爻</Text> · 空=旬空 ·
          動→變出之爻 · 伏=伏神
        </Text>
      </View>

      {/* 變卦 */}
      {bian && (
        <View style={styles.card}>
          <Text style={styles.tableTitle}>變卦 · {bian.卦名}</Text>
          <Text style={styles.guaSub}>
            {bian.卦宮}宮 · {bian.卦變} · 世爻五行 {bian.世爻五行}
          </Text>
          <Text style={[styles.guaCi, { marginBottom: spacing.sm }]}>{bian.卦辭}</Text>
          {topDown(bian.爻).map((y) => {
            const relColor = wuxingColor[y.五行] || colors.text;
            return (
              <View key={y.爻序index} style={styles.bianRow}>
                <Text style={styles.bianPos}>{y.爻序名}</Text>
                <Text style={styles.bianSymbol}>{y.爻象}</Text>
                <Text style={[styles.bianRel, { color: relColor }]}>
                  {y.六親}
                  <Text style={styles.wx}> {y.五行}</Text>
                </Text>
                <Text style={styles.bianGz}>{y.干支}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function YaoRow({ e, ben }: { e: LiuYaoEntry; ben?: Yao }) {
  const relColor = wuxingColor[e.五行] || colors.text;
  const state = [e.當值, e.生剋].filter(Boolean).join(" / ");
  const out = e.動爻出去;
  const fu = e.伏神 && e.伏神.length ? e.伏神[0] : null;
  const shensha = ben?.神煞 || "";
  const details: string[] = [];
  if (state) details.push(`旺衰 ${state}`);
  if (e.動爻 && out) details.push(`動→${out.六親}${out.地支}${out.生剋 ? `(${out.生剋})` : ""}`);
  if (fu) details.push(`伏:${fu.六親}${fu.地支}`);
  if (shensha) details.push(shensha);

  return (
    <View style={[styles.yaoBlock, e.動爻 && styles.yaoMoving]}>
      <View style={styles.yaoMain}>
        <Text style={styles.colPos}>
          {e.爻序名}
          {e.世 ? <Text style={[styles.tag, { color: colors.shi }]}> 世</Text> : null}
          {e.應 ? <Text style={[styles.tag, { color: colors.ying }]}> 應</Text> : null}
        </Text>
        <Text style={styles.colSymbol}>{ben?.爻象 ?? ""}</Text>
        <Text style={styles.colSix}>{e.六神}</Text>
        <Text style={[styles.colRel, { color: relColor }]}>
          {e.六親}
          <Text style={styles.wx}> {e.五行}</Text>
        </Text>
        <Text style={styles.colGz}>
          {e.干支}
          {e.空亡 ? <Text style={styles.kong}> 空</Text> : null}
          {e.動爻 ? <Text style={{ color: colors.moving }}> 動</Text> : null}
        </Text>
      </View>
      {details.length > 0 && <Text style={styles.yaoDetail}>{details.join("　·　")}</Text>}
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
  yaoBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 7,
  },
  yaoMoving: { backgroundColor: "#fbeeee" },
  yaoMain: { flexDirection: "row", alignItems: "center" },
  colPos: { width: 64, fontSize: 13, color: colors.text },
  colSymbol: {
    width: 40,
    fontSize: 13,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  colSix: { width: 40, fontSize: 13, color: colors.text },
  colRel: { width: 60, fontSize: 13 },
  colGz: { flex: 1, fontSize: 13, color: colors.text },
  yaoDetail: {
    marginTop: 3,
    marginLeft: 64,
    fontSize: 11.5,
    color: colors.subtle,
    lineHeight: 17,
  },
  tag: { fontSize: 12, fontWeight: "700" },
  wx: { fontSize: 11, color: colors.subtle },
  kong: { color: colors.accent, fontWeight: "700" },
  legend: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 11,
    color: colors.subtle,
    lineHeight: 16,
  },
  bianRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  bianPos: { width: 52, fontSize: 13, color: colors.subtle },
  bianSymbol: {
    width: 56,
    fontSize: 14,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  bianRel: { width: 64, fontSize: 13 },
  bianGz: { flex: 1, fontSize: 13, color: colors.text },
});
