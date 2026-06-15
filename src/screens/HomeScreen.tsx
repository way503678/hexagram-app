import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navTypes";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
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

        {/* 入口 */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.entry, pressed && styles.entryPressed]}
            onPress={() => navigation.navigate("Cast", { mode: "coin" })}
          >
            <Text style={styles.entryIcon}>🪙</Text>
            <View style={styles.entryTextWrap}>
              <Text style={styles.entryTitle}>手動擲卦</Text>
              <Text style={styles.entryDesc}>金錢卦,親手擲六爻起卦</Text>
            </View>
            <Text style={styles.entryArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.entry, pressed && styles.entryPressed]}
            onPress={() => navigation.navigate("Cast", { mode: "time" })}
          >
            <Text style={styles.entryIcon}>🕐</Text>
            <View style={styles.entryTextWrap}>
              <Text style={styles.entryTitle}>時辰起卦</Text>
              <Text style={styles.entryDesc}>指定日期時辰,自動起卦</Text>
            </View>
            <Text style={styles.entryArrow}>›</Text>
          </Pressable>
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
  scroll: { padding: spacing.xl, paddingTop: spacing.xl * 2 },
  top: { alignItems: "center" },
  symbol: { fontSize: 56, color: colors.primary },
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
  actions: { marginTop: spacing.xl * 1.5, gap: spacing.md },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  entryPressed: { opacity: 0.7 },
  entryIcon: { fontSize: 26, marginRight: spacing.md },
  entryTextWrap: { flex: 1 },
  entryTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  entryDesc: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  entryArrow: { fontSize: 24, color: colors.subtle },
  footer: { alignItems: "center", marginTop: spacing.xl * 2 },
  footerText: { fontSize: 12, color: colors.subtle, lineHeight: 20 },
});
