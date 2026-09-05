import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChartResponse, LiuYaoEntry, Yao } from "../types";
import { colors, spacing, wuxingColor } from "../theme";
import YaoGlyph from "./YaoGlyph";

interface Props {
  chart: ChartResponse;
  compact?: boolean;
}

/** 由 初→上 反轉成 上→初(傳統由上而下呈現)。 */
function topDown<T extends { index?: number; 爻序index?: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const ai = a.index ?? a.爻序index ?? 0;
    const bi = b.index ?? b.爻序index ?? 0;
    return bi - ai;
  });
}

export default function ChartResult({ chart, compact = false }: Props) {
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
      {ben.卦名 || bian?.卦名 || ben.卦辭 ? (
        <View style={[styles.card, compact && styles.cardCompact]}>
          <Text style={styles.guaName} numberOfLines={2}>
            {ben.卦名}
            {bian ? <Text style={styles.arrow}>　→　{bian.卦名}</Text> : null}
          </Text>
          <Text style={styles.guaSub}>
            {ben.卦宮}宮 · {ben.卦變} · 世爻五行 {ben.世爻五行}
          </Text>
          <Text style={styles.guaCi}>{ben.卦辭}</Text>
        </View>
      ) : null}

      {/* 排盤資訊 */}
      <View style={[styles.card, compact && styles.cardCompact]}>
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
      <View style={[styles.card, compact && styles.cardCompact]}>
        <Text style={styles.tableTitle}>六爻(本卦)</Text>
        <View style={styles.yaoHeader}>
          <Text style={[styles.headerText, styles.headerSymbol, compact && styles.headerSymbolCompact]}>爻象</Text>
          <Text style={[styles.headerText, styles.headerSix, compact && styles.headerSixCompact]}>六神</Text>
          <Text style={[styles.headerText, styles.headerRel, compact && styles.headerRelCompact]}>六親</Text>
          <Text style={[styles.headerText, styles.headerGz]}>干支</Text>
        </View>
        {rows.map((e) => (
          <YaoRow key={e.index} e={e} ben={benByIndex.get(e.index)} compact={compact} />
        ))}
        <Text style={styles.legend}>
          世/應在爻象下 · <Text style={{ color: colors.moving }}>紅=動爻</Text> · 空=旬空 ·
          動→變出之爻 · 六親下小字=伏神
        </Text>
      </View>

      {/* 變卦 */}
      {bian && (
        <View style={[styles.card, compact && styles.cardCompact]}>
          <Text style={styles.tableTitle}>變卦 · {bian.卦名}</Text>
          <Text style={styles.guaSub}>
            {bian.卦宮}宮 · {bian.卦變} · 世爻五行 {bian.世爻五行}
          </Text>
          <Text style={[styles.guaCi, { marginBottom: spacing.sm }]}>{bian.卦辭}</Text>
          {topDown(bian.爻).map((y) => {
            const relColor = wuxingColor[y.五行] || colors.text;
            return (
              <View key={y.爻序index} style={styles.bianRow}>
                <View style={[styles.bianSymbol, compact && styles.bianSymbolCompact]}>
                  <YaoGlyph yin={y.陰陽 === "陰"} width={compact ? 48 : 56} compact />
                </View>
                <Text
                  style={[styles.bianRel, compact && styles.bianRelCompact, { color: relColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  {y.六親}
                  <Text style={styles.wx}> {y.五行}</Text>
                </Text>
                <Text
                  style={styles.bianGz}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  {y.干支}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function YaoRow({ e, ben, compact }: { e: LiuYaoEntry; ben?: Yao; compact: boolean }) {
  const relColor = wuxingColor[e.五行] || colors.text;
  const out = e.動爻出去;
  const fu = e.伏神 && e.伏神.length ? e.伏神[0] : null;
  const details: string[] = [];
  if (e.動爻 && out) details.push(`動→${out.六親}${out.地支}${out.生剋 ? `(${out.生剋})` : ""}`);

  return (
    <View style={[styles.yaoBlock, e.動爻 && styles.yaoMoving]}>
      <View style={styles.yaoMain}>
        <View style={[styles.colSymbolWrap, compact && styles.colSymbolWrapCompact]}>
          <YaoGlyph
            yin={(ben?.陰陽 ?? e.陰陽) === "陰"}
            moving={e.動爻}
            width={compact ? 54 : 62}
            compact
          />
          {e.世 ? <Text style={[styles.syTag, { color: colors.shi }]}>世爻</Text> : null}
          {e.應 ? <Text style={[styles.syTag, { color: colors.ying }]}>應爻</Text> : null}
        </View>
        <Text
          style={[styles.colSix, compact && styles.colSixCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {e.六神}
        </Text>
        <View style={[styles.colRelWrap, compact && styles.colRelWrapCompact]}>
          <Text style={[styles.colRel, { color: relColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {e.六親}
            <Text style={styles.wx}> {e.五行}</Text>
          </Text>
          {fu ? <Text style={styles.fuSub}>{fu.六親}{fu.地支}</Text> : null}
        </View>
        <Text style={styles.colGz} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {e.干支}
          {e.空亡 ? <Text style={styles.kong}> 空</Text> : null}
        </Text>
      </View>
      {details.length > 0 && (
        <Text style={[styles.yaoDetail, compact && styles.yaoDetailCompact]}>
          {details.join("　·　")}
        </Text>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel} numberOfLines={1}>{label}</Text>
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
  cardCompact: { paddingHorizontal: spacing.md, paddingVertical: 18 },
  guaName: { fontSize: 22, fontWeight: "700", color: colors.text },
  arrow: { fontSize: 18, color: colors.subtle, fontWeight: "400" },
  guaSub: { marginTop: spacing.xs, color: colors.subtle, fontSize: 13 },
  guaCi: { marginTop: spacing.sm, color: colors.text, lineHeight: 22 },
  infoRow: { flexDirection: "row", paddingVertical: 3 },
  infoLabel: { width: 96, color: colors.subtle, fontSize: 13 },
  infoValue: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, lineHeight: 20 },
  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  yaoBlock: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 7,
  },
  yaoMoving: { backgroundColor: "#fbeeee" },
  yaoHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 5,
  },
  headerText: { color: colors.faint, fontSize: 10.5, fontWeight: "700" },
  headerSymbol: { width: 72 },
  headerSymbolCompact: { width: 62 },
  headerSix: { width: 44 },
  headerSixCompact: { width: 40 },
  headerRel: { width: 70 },
  headerRelCompact: { width: 62 },
  headerGz: { flex: 1, minWidth: 0, textAlign: "right" },
  yaoMain: { width: "100%", flexDirection: "row", alignItems: "flex-start", minHeight: 38 },
  colSymbolWrap: { width: 72, alignItems: "flex-start" },
  colSymbolWrapCompact: { width: 62 },
  syTag: { fontSize: 10, fontWeight: "700", marginTop: 1 },
  colSix: { width: 44, fontSize: 13, lineHeight: 28, color: colors.text },
  colSixCompact: { width: 40 },
  colRelWrap: { width: 70, paddingTop: 5 },
  colRelWrapCompact: { width: 62 },
  colRel: { fontSize: 13 },
  fuSub: { fontSize: 10, color: colors.faint, marginTop: 1 },
  colGz: { flex: 1, minWidth: 0, paddingTop: 5, fontSize: 13, color: colors.text, textAlign: "right" },
  yaoDetail: {
    marginTop: 2,
    marginLeft: 72,
    fontSize: 11.5,
    color: colors.subtle,
    lineHeight: 17,
  },
  yaoDetailCompact: { marginLeft: 62, fontSize: 11 },
  tag: { fontSize: 12, fontWeight: "700" },
  wx: { fontSize: 11, color: colors.subtle },
  kong: { color: colors.primary, fontWeight: "700" },
  legend: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 11,
    color: colors.subtle,
    lineHeight: 16,
  },
  bianRow: { width: "100%", flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  bianSymbol: {
    width: 72,
    alignItems: "flex-start",
  },
  bianSymbolCompact: { width: 62 },
  bianRel: { width: 64, fontSize: 13 },
  bianRelCompact: { width: 58 },
  bianGz: { flex: 1, minWidth: 0, fontSize: 13, color: colors.text, textAlign: "right" },
});
