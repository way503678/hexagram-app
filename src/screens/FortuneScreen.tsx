import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import FortunePanel from "../components/FortunePanel";
import { colors, spacing } from "../theme";

export default function FortuneScreen() {
  const { user } = useAuth();
  const nav = useNavigation<any>();
  const hasBirth = user?.birth_y != null && user.birth_m != null && user.birth_d != null && user.birth_h != null;
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>看見這一年的方向</Text>
        <Text style={styles.description}>從流年走到每個月，讓命果陪你整理生活的節奏。</Text>
        <View style={styles.profile}>
          <Text style={styles.description}>{hasBirth
            ? `${user!.birth_y} 年 ${user!.birth_m} 月 ${user!.birth_d} 日 ${user!.birth_h} 時 · ${user!.gender === "M" ? "男" : user!.gender === "F" ? "女" : "未設定性別"}`
            : "先填寫出生年月日時，就能查看你的流年。"}</Text>
          <TouchableOpacity onPress={() => nav.navigate("Tabs", { screen: "Member" })}>
            <Text style={styles.link}>{hasBirth ? "修改出生資料 ›" : "前往填寫出生資料 ›"}</Text>
          </TouchableOpacity>
        </View>
        {hasBirth && <FortunePanel birth={{ y: user!.birth_y!, m: user!.birth_m!, d: user!.birth_d!, h: user!.birth_h! }} gender={user!.gender || ""} />}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: 14, lineHeight: 23, color: colors.subtle },
  profile: { marginTop: spacing.lg, marginBottom: spacing.md },
  link: { color: colors.primary, fontSize: 14, paddingVertical: spacing.sm },
});
