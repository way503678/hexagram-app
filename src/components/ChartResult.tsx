import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
  const tableScrollRef = React.useRef<ScrollView>(null);
  const [tableViewportWidth, setTableViewportWidth] = React.useState(0);
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
        <Text style={styles.tableTitle}>六爻</Text>
        <View style={styles.tableViewport} onLayout={(event) => setTableViewportWidth(event.nativeEvent.layout.width)}>
          <ScrollView
            ref={tableScrollRef}
            horizontal
            showsHorizontalScrollIndicator={compact}
            onContentSizeChange={() => tableScrollRef.current?.scrollToEnd({ animated: false })}
          >
            <View style={[styles.tableGrid, { width: Math.max(tableViewportWidth, 346) }]}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, styles.bianGroup]}>變卦</Text>
                <Text style={[styles.groupTitle, styles.benGroup]}>本卦</Text>
              </View>
              <View style={styles.yaoHeader}>
                <Text style={[styles.headerText, styles.tableCell]}>爻象</Text>
                <Text style={[styles.headerText, styles.tableCell]}>六親</Text>
                <Text style={[styles.headerText, styles.tableCell]}>干支</Text>
                <Text style={[styles.headerText, styles.tableCell, styles.groupDivider]}>爻象</Text>
                <Text style={[styles.headerText, styles.tableCell]}>干支</Text>
                <Text style={[styles.headerText, styles.tableCell]}>六親</Text>
                <Text style={[styles.headerText, styles.tableCell]}>六神</Text>
              </View>
              {rows.map((e) => (
                <YaoRow key={e.index} e={e} ben={benByIndex.get(e.index)} compact={compact} />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function YaoRow({ e, ben, compact }: { e: LiuYaoEntry; ben?: Yao; compact: boolean }) {
  const relColor = wuxingColor[e.五行] || colors.text;
  const out = e.動爻出去;
  const fu = e.伏神 && e.伏神.length ? e.伏神[0] : null;
  const baseYin = (ben?.陰陽 ?? e.陰陽) === "陰";
  const showChanged = e.動爻 && !!out;
  const outColor = out ? wuxingColor[out.五行] || colors.text : colors.text;

  return (
    <View style={[styles.yaoBlock, e.動爻 && styles.yaoMoving]}>
      <View style={styles.yaoMain}>
        <View style={styles.tableSymbolCell}>
          {showChanged ? <YaoGlyph yin={!baseYin} width={compact ? 32 : 40} compact /> : null}
        </View>
        <Text style={[styles.tableTextCell, { color: outColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
          {showChanged ? out?.六親 : ""}
        </Text>
        <Text style={styles.tableTextCell} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
          {showChanged ? out?.干支 : ""}
        </Text>
        <View style={[styles.tableSymbolCell, styles.groupDivider]}>
          <YaoGlyph
            yin={baseYin}
            moving={e.動爻}
            width={compact ? 32 : 40}
            compact
          />
          {e.世 ? <Text style={[styles.syTag, { color: colors.shi }]}>世爻</Text> : null}
          {e.應 ? <Text style={[styles.syTag, { color: colors.ying }]}>應爻</Text> : null}
        </View>
        <View style={styles.tableStackCell}>
          <Text style={styles.tableCellMain} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
            {e.干支}
          </Text>
          {e.空亡 ? <Text style={styles.kongSub}>空</Text> : null}
        </View>
        <View style={styles.tableRelCell}>
          <Text style={[styles.colRel, { color: relColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {e.六親}
          </Text>
          {fu ? <Text style={styles.fuSub}>{fu.六親}{fu.地支}</Text> : null}
        </View>
        <Text style={styles.tableTextCell} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
          {e.六神}
        </Text>
      </View>
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
  tableViewport: { width: "100%", overflow: "hidden" },
  tableGrid: { minWidth: 346 },
  groupHeader: { width: "100%", flexDirection: "row", alignItems: "center", marginBottom: 3 },
  groupTitle: { color: colors.subtle, fontSize: 11, fontWeight: "700", textAlign: "center" },
  bianGroup: { width: "42.857142%" },
  benGroup: { width: "57.142858%", borderLeftWidth: 1, borderLeftColor: colors.border },
  yaoHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 5,
  },
  headerText: { color: colors.faint, fontSize: 9.5, fontWeight: "700", textAlign: "center" },
  tableCell: { width: "14.285714%", minWidth: 0 },
  groupDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  yaoMain: { width: "100%", flexDirection: "row", alignItems: "flex-start", minHeight: 38 },
  tableSymbolCell: { width: "14.285714%", minWidth: 0, alignItems: "center" },
  tableTextCell: {
    width: "14.285714%",
    minWidth: 0,
    paddingTop: 5,
    paddingHorizontal: 1,
    fontSize: 12,
    color: colors.text,
    textAlign: "center",
  },
  tableStackCell: { width: "14.285714%", minWidth: 0, paddingTop: 5, alignItems: "center" },
  tableCellMain: { width: "100%", paddingHorizontal: 1, fontSize: 12, color: colors.text, textAlign: "center" },
  kongSub: { marginTop: 1, fontSize: 9, color: colors.primary, fontWeight: "700" },
  tableRelCell: { width: "14.285714%", minWidth: 0, paddingTop: 5, alignItems: "center" },
  syTag: { fontSize: 9, fontWeight: "700", marginTop: 1 },
  colRel: { fontSize: 12, textAlign: "center" },
  fuSub: { fontSize: 9, color: colors.faint, marginTop: 1, textAlign: "center" },
});
