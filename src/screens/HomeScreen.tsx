import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors, radius, shadowSoft, spacing } from "../theme";
import { PrimaryButton } from "../components/ui";
import AlmanacCard from "../components/AlmanacCard";
import { fetchDaily, fetchAlmanacDay, DailyGuide } from "../api";
import { AlmanacDay } from "../types";
import { useAuth } from "../AuthContext";

const HERO = require("../../assets/mingo/mountain-sunrise.png");

export default function HomeScreen() {
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* 品牌 */}
        <View style={styles.logoRow}>
          <Text style={styles.logo}>命果</Text>
          <Text style={styles.logoSub}>MINGO</Text>
        </View>

        {/* 山景晨光 Hero + 問候 */}
        <ImageBackground source={HERO} style={styles.hero} imageStyle={styles.heroImg}>
          <View style={styles.heroShade} />
          <Text style={styles.h1}>你好,{name} ✨</Text>
          <Text style={styles.heroBody}>
            無論你現在在哪個階段,命運都在變化,一切都會更好。
          </Text>
        </ImageBackground>

        {/* 今日指引(疊在 Hero 下緣)*/}
        <View style={styles.guideCard}>
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
        </View>

        {/* 今日黃曆(依據)*/}
        {day ? (
          <View style={{ marginTop: spacing.md }}>
            <AlmanacCard day={day} />
          </View>
        ) : null}

        {/* CTA */}
        <PrimaryButton
          title="開始今日探索 ✦ 卜一卦"
          onPress={() => nav.navigate("Cast", { mode: "coin" })}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 110 },
  logoRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: spacing.md },
  logo: { fontSize: 24, color: colors.primaryDark, fontWeight: "800", letterSpacing: 3 },
  logoSub: { fontSize: 12, color: colors.gold, letterSpacing: 5, fontWeight: "700" },
  hero: { height: 280, padding: 22, justifyContent: "flex-end" },
  heroImg: { borderRadius: 28 },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: "rgba(255,249,244,0.18)",
  },
  h1: { fontSize: 26, fontWeight: "800", color: colors.primaryDark, marginBottom: 8, letterSpacing: 1 },
  heroBody: { fontSize: 15, lineHeight: 24, color: colors.text, maxWidth: "92%" },
  guideCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    marginTop: -36,
    ...shadowSoft,
  },
  tag: { color: colors.primary, fontSize: 13, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  guideText: { fontSize: 18, color: colors.primaryDark, fontWeight: "700", lineHeight: 28 },
  guideSub: { fontSize: 14, color: colors.subtle, lineHeight: 23, marginTop: spacing.sm },
});
