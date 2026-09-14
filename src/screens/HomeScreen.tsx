import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors, gradients, radius, shadowSoft, spacing } from "../theme";
import { PrimaryButton } from "../components/ui";
import AlmanacCard from "../components/AlmanacCard";
import { fetchDaily, fetchAlmanacDay, DailyGuide } from "../api";
import { AlmanacDay } from "../types";
import { useAuth } from "../AuthContext";

const HERO = require("../../assets/mingo/mountain_v3.png");
const BRAND_MARK = require("../../assets/mingo/mingo-mark.png");

export default function HomeScreen() {
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 390 || fontScale > 1.1;
  const heroMinHeight = Math.max(compact ? 360 : 400, Math.round(height * 0.58));
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const name = (user?.display_name || user?.email || "").split("@")[0] || "朋友";
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const needBirthday = daily?.needs_birthday;
  const guideLine = daily && !needBirthday ? daily.整體狀態 : null;
  const guideSub =
    daily && !needBirthday && daily.今日提醒 && daily.今日提醒.length
      ? daily.今日提醒[0]
      : null;

  return (
    <View style={styles.bg}>
      <Image source={HERO} resizeMode="cover" style={styles.backgroundImage} />
      <View style={styles.pageShade} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* 品牌固定；問候放進下方滑動內容 */}
        <View style={[styles.titleWrap, compact && styles.titleWrapCompact]}>
          <Image source={BRAND_MARK} resizeMode="contain" style={styles.brandMark} />
          <Text style={styles.logo}>命果</Text>
        </View>

        {/* 背景與品牌固定，問候和前景卡片一起滑動 */}
        <ScrollView
          style={styles.cardScroller}
          contentContainerStyle={[styles.cards, compact && styles.cardsCompact]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        >
          <View
            style={[
              styles.heroCopy,
              compact && styles.heroCopyCompact,
              { minHeight: heroMinHeight },
            ]}
          >
            <Text
              style={[styles.h1, compact && styles.h1Compact]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              你好，{name} ☀️
            </Text>
            <Text style={styles.heroBody}>
              命運在變化，{"\n"}而你，永遠有選擇。
            </Text>
          </View>

          <LinearGradient
            colors={gradients.frosted}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.guideCard, compact && styles.guideCardCompact]}
          >
            <Text style={styles.tag}>今日指引</Text>
            {loading && !daily ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : needBirthday ? (
              <>
                <Text style={styles.guideText}>
                  設定你的生日,就能解鎖每天為你量身的方向。
                </Text>
                <PrimaryButton
                  title="去設定生日"
                  onPress={() => nav.navigate("Member")}
                  style={{ marginTop: spacing.md, alignSelf: "flex-start" }}
                />
              </>
            ) : (
              <>
                <Text style={styles.guideText}>{guideLine}</Text>
                {guideSub ? <Text style={styles.guideSub}>{guideSub}</Text> : null}
              </>
            )}
          </LinearGradient>

          {day ? (
            <View style={{ marginTop: spacing.md }}>
              <AlmanacCard day={day} compact={compact} />
            </View>
          ) : null}

          <PrimaryButton
            title="開始今日探索 ✦ 卜一卦"
            onPress={() => nav.navigate("Cast", { mode: "coin" })}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  safe: { flex: 1, backgroundColor: "transparent" },
  pageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,249,244,0.18)",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleWrapCompact: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  brandMark: { width: 28, height: 28 },
  logo: { fontSize: 20, color: colors.primaryDark, fontWeight: "800", letterSpacing: 4 },
  heroCopy: {
    paddingTop: 44,
    paddingBottom: spacing.lg,
  },
  heroCopyCompact: {
    paddingTop: 40,
    paddingBottom: spacing.md,
  },
  cardScroller: { flex: 1 },
  cards: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  cardsCompact: { paddingHorizontal: spacing.md },
  h1: { fontSize: 24, fontWeight: "800", color: colors.primaryDark, marginBottom: 12, letterSpacing: 0.5 },
  h1Compact: { fontSize: 22 },
  heroBody: { fontSize: 16, lineHeight: 26, color: colors.text, fontWeight: "600" },
  guideCard: {
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    ...shadowSoft,
  },
  guideCardCompact: { padding: spacing.md },
  tag: { color: colors.primary, fontSize: 13, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  guideText: { fontSize: 18, color: colors.primaryDark, fontWeight: "700", lineHeight: 28 },
  guideSub: { fontSize: 14, color: colors.subtle, lineHeight: 23, marginTop: spacing.sm },
});
