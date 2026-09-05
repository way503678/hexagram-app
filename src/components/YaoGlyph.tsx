import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

interface Props {
  yin?: boolean;
  moving?: boolean;
  empty?: boolean;
  width?: number;
  compact?: boolean;
}

/**
 * 固定幾何尺寸的爻象。不要用 Unicode 橫線排卦，避免 iOS/Android 字型寬度不同而錯位。
 */
export default function YaoGlyph({
  yin = false,
  moving = false,
  empty = false,
  width = 104,
  compact = false,
}: Props) {
  const lineColor = empty ? colors.border : moving ? colors.moving : colors.text;
  const markerWidth = compact ? 18 : 24;
  const brokenGap = compact ? 12 : 16;
  const gap = moving ? markerWidth : brokenGap;
  const segmentWidth = (width - gap) / 2;
  const split = yin || moving;

  return (
    <View style={[styles.root, { width }]} accessibilityLabel={empty ? "未擲" : `${yin ? "陰爻" : "陽爻"}${moving ? "動爻" : ""}`}>
      {split ? (
        <>
          <View style={[styles.line, { width: segmentWidth, backgroundColor: lineColor }]} />
          <View style={{ width: gap, alignItems: "center" }}>
            {moving ? (
              <Text style={[styles.marker, compact && styles.markerCompact, { color: lineColor }]}>
                {yin ? "×" : "○"}
              </Text>
            ) : null}
          </View>
          <View style={[styles.line, { width: segmentWidth, backgroundColor: lineColor }]} />
        </>
      ) : (
        <View style={[styles.line, { width, backgroundColor: lineColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  line: { height: 2, borderRadius: 2 },
  marker: { fontSize: 22, lineHeight: 26, textAlign: "center" },
  markerCompact: { fontSize: 17, lineHeight: 22 },
});
