import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 標題區(對應網頁首頁) */}
        <View style={styles.top}>
          <Text style={styles.symbol}>☯</Text>
          <Text style={styles.title}>命卦排盤</Text>
          <Text style={styles.subtitle}>觀時 · 知運 · 問心</Text>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dot}>·</Text>
            <View style={styles.line} />
          </View>
        </View>

        {/* 詩句 */}
        <View style={styles.poem}>
          <Text style={styles.poemLine}>明日何如,昔日何往。</Text>
          <Text style={styles.poemLine}>舉杯邀月,月不能語;</Text>
          <Text style={styles.poemLine}>展卦觀爻,爻自有聲。</Text>
          <Text style={[styles.poemLine, styles.poemLast]}>
            所往者已逝,所來者未至,
          </Text>
          <Text style={[styles.poemLine, styles.poemLast]}>
            所在者,唯此一念之間。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>本系統依京房納甲法、野鶴派飛伏理論製作</Text>
          <Text style={styles.footerText}>僅供研究參考,不能取代專業諮詢</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    paddingVertical: spacing.xl * 2,
  },
  top: { alignItems: "center" },
  symbol: { fontSize: 60, color: colors.primary },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.subtle,
    marginTop: spacing.sm,
    letterSpacing: 6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    width: 160,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dot: { color: colors.subtle, marginHorizontal: spacing.sm },
  poem: { alignItems: "center", marginTop: spacing.xl * 1.5 },
  poemLine: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 30,
    letterSpacing: 1,
  },
  poemLast: { color: colors.subtle },
  footer: { alignItems: "center", marginTop: spacing.xl * 2 },
  footerText: { fontSize: 12, color: colors.subtle, lineHeight: 20 },
});
