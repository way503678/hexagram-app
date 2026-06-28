import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors, spacing } from "../theme";
import { GradientCard, SectionCard, PrimaryButton } from "../components/ui";
import AlmanacCard from "../components/AlmanacCard";
import { fetchDaily, fetchAlmanacDay, DailyGuide } from "../api";
import { AlmanacDay } from "../types";

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [daily, setDaily] = useState<DailyGuide | null>(null);
  const [day, setDay] = useState<AlmanacDay | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [dRes, aRes] = await Promise.allSettled([
      fetchDaily(),
      fetchAlmanacDay(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    ]);
    if (dRes.status === "fulfilled") setDaily(dRes.value);
    if (aRes.status === "fulfilled") setDay(aRes.value);
    setLoading(false);
  }, []);

  // 進入分頁就刷新(設完生日回來會更新今日指引)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const guideLine =
    daily && !daily.needs_birthday ? daily.整體狀態 : null;
  const guideSub =
    daily && !daily.needs_birthday && daily.今日提醒 && daily.今日提醒.length
      ? daily.今日提醒[0]
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* 品牌 */}
        <View style={styles.brand}>
          <Text style={styles.brandZh}>命果</Text>
          <Text style={styles.brandEn}>MINGO</Text>
        </View>
        <Text style={styles.tagline}>看懂變化,走向更好的自己</Text>

        <Text style={styles.lead}>今天適合探索什麼?</Text>

        {/* 今日指引(主角)*/}
        {loading && !daily ? (
          <SectionCard style={styles.guideLoading}>
            <ActivityIndicator color={colors.primary} />
          </SectionCard>
        ) : daily?.needs_birthday ? (
          <SectionCard style={styles.guideCard}>
            <Text style={styles.guideTag}>今日指引</Text>
            <Text style={styles.guideText}>
              設定你的生日,就能解鎖每天為你量身的方向。
            </Text>
            <PrimaryButton
              title="去設定生日"
              onPress={() => nav.navigate("Member")}
              style={{ marginTop: spacing.md, alignSelf: "flex-start" }}
            />
          </SectionCard>
        ) : (
          <GradientCard variant="deep" style={styles.guideHero}>
            <Text style={styles.guideHeroTag}>今日指引 ✦</Text>
            <Text style={styles.guideHeroText}>{guideLine}</Text>
            {guideSub ? <Text style={styles.guideHeroSub}>{guideSub}</Text> : null}
          </GradientCard>
        )}

        {/* 今日黃曆(依據,放卡片內)*/}
        {day ? <View style={{ marginTop: spacing.md }}><AlmanacCard day={day} /></View> : null}

        {/* CTA */}
        <PrimaryButton
          title="開始今日探索 ✦ 卜一卦"
          onPress={() => nav.navigate("Cast", { mode: "coin" })}
          style={{ marginTop: spacing.lg }}
        />

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  brand: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  brandZh: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: 3 },
  brandEn: { fontSize: 14, color: colors.accent, fontWeight: "700", letterSpacing: 6 },
  tagline: { fontSize: 14, color: colors.subtle, marginTop: 4, letterSpacing: 1 },
  lead: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  guideLoading: { alignItems: "center", paddingVertical: spacing.xl },
  guideCard: {},
  guideTag: { fontSize: 12, fontWeight: "700", color: colors.accent, letterSpacing: 3, marginBottom: spacing.sm },
  guideText: { fontSize: 16, color: colors.text, lineHeight: 26 },
  guideHero: { minHeight: 120, justifyContent: "center" },
  guideHeroTag: { fontSize: 12, color: colors.gold, letterSpacing: 3, marginBottom: spacing.sm },
  guideHeroText: { fontSize: 19, color: "#fff", fontWeight: "700", lineHeight: 30 },
  guideHeroSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 23, marginTop: spacing.sm },
});
