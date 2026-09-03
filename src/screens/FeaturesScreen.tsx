/** 功能頁:目前只放「今日黃曆」與「卜卦問事」(未來再加流年/命盤/AI)。 */
import React from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme";
import { SectionCard } from "../components/ui";
import { TouchableOpacity } from "react-native";
import MingoIcon, { MingoIconName } from "../components/MingoIcon";

function MenuCard({
  icon,
  title,
  sub,
  onPress, compact,
}: {
  icon: MingoIconName;
  title: string;
  sub: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <SectionCard style={styles.menuCard}>
        <MingoIcon name={icon} size={compact ? 34 : 42} style={{ marginRight: compact ? spacing.sm : spacing.md }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSub}>{sub}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </SectionCard>
    </TouchableOpacity>
  );
}

export default function FeaturesScreen() {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 390 || fontScale > 1.1;
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}>
        <Text style={styles.h1}>探索</Text>
        <MenuCard
          icon="guide"
          title="今日黃曆"
          sub="宜忌・吉時・五行,看今天的能量"
          compact={compact}
          onPress={() => nav.navigate("Almanac")}
        />
        <MenuCard
          icon="divination"
          title="卜卦問事"
          sub="有問題?問命果，陪你想清楚下一步"
          compact={compact}
          onPress={() => nav.navigate("Cast", { mode: "coin" })}
        />
        <Text style={styles.soon}>更多功能(流年・命盤・AI)即將登場 ✦</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  scrollCompact: { padding: spacing.md },
  h1: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  menuCard: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  menuIcon: { fontSize: 26, marginRight: spacing.md },
  menuTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  menuSub: { flexShrink: 1, fontSize: 13, lineHeight: 19, color: colors.subtle, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.accent, marginLeft: spacing.sm },
  soon: { fontSize: 13, color: colors.subtle, textAlign: "center", marginTop: spacing.lg },
});
