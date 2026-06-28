import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { GradientCard, SectionCard } from "../components/ui";
import { useAuth } from "../AuthContext";

export default function HomeScreen() {
  const { user } = useAuth();
  const name = (user?.display_name || user?.email || "").split("@")[0] || "朋友";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 頂部品牌列 */}
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <Text style={styles.brandSymbol}>☯</Text>
            <View>
              <Text style={styles.brandZh}>命果</Text>
              <Text style={styles.brandEn}>MINGO</Text>
            </View>
          </View>
        </View>

        {/* 問候 */}
        <Text style={styles.greeting}>你好,{name} ✦</Text>
        <Text style={styles.greetingSub}>
          無論你現在在哪個階段,命運都在變化,一切都會更好。
        </Text>

        {/* 主視覺漸層卡 */}
        <GradientCard variant="deep" style={styles.hero}>
          <Text style={styles.heroStar}>✦ ˚ ⋆</Text>
          <Text style={styles.heroTitle}>看懂變化</Text>
          <Text style={styles.heroTitle}>走向更好的自己</Text>
          <Text style={styles.heroEn}>KNOW THE CHANGE, WALK YOUR PATH.</Text>
        </GradientCard>

        {/* 今日指引(階段一:呈現引導語,詳情頁為後續功能) */}
        <SectionCard style={styles.guideCard}>
          <Text style={styles.guideTag}>今日指引</Text>
          <Text style={styles.guideText}>
            今天適合慢下來,整理思緒,聆聽內心的聲音。
          </Text>
          <Text style={styles.guideHint}>更完整的每日能量解析即將登場 ✦</Text>
        </SectionCard>

        {/* 詩句 */}
        <View style={styles.poem}>
          <Text style={styles.poemLine}>所往者已逝,所來者未至,</Text>
          <Text style={styles.poemLine}>所在者,唯此一念之間。</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>依京房納甲法、野鶴派飛伏理論製作</Text>
          <Text style={styles.footerText}>僅供研究參考,不能取代專業諮詢</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  brandLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandSymbol: { fontSize: 30, color: colors.primary },
  brandZh: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: 2 },
  brandEn: { fontSize: 11, color: colors.accent, letterSpacing: 6, fontWeight: "700" },
  greeting: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: 1 },
  greetingSub: {
    fontSize: 14,
    color: colors.subtle,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  hero: { marginBottom: spacing.lg, minHeight: 168, justifyContent: "center" },
  heroStar: { color: colors.gold, fontSize: 14, letterSpacing: 4, marginBottom: spacing.sm },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 3,
    lineHeight: 36,
  },
  heroEn: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  guideCard: { marginBottom: spacing.lg },
  guideTag: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  guideText: { fontSize: 16, color: colors.text, lineHeight: 26 },
  guideHint: { fontSize: 12, color: colors.subtle, marginTop: spacing.md },
  poem: { alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  poemLine: { fontSize: 15, color: colors.subtle, lineHeight: 28, letterSpacing: 1 },
  footer: { alignItems: "center" },
  footerText: { fontSize: 12, color: colors.subtle, lineHeight: 20 },
});
