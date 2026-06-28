/**
 * 首次開啟的 Splash + 同意書(個資 + 免責)。
 * 看完按「我已了解」→ 記到本機,之後不再出現。
 */
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { PrimaryButton } from "../components/ui";
import { PRIVACY_CONSENT, DISCLAIMER } from "../legal";

function ConsentItem({ doc }: { doc: { title: string; body: string[] } }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.item}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.itemHead} hitSlop={6}>
        <Text style={styles.itemTitle}>
          {open ? "▾" : "▸"}  {doc.title}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.body}>
          {doc.body.map((p, i) => (
            <Text key={i} style={styles.p}>
              {p}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SplashConsent({ onAccept }: { onAccept: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <Text style={styles.symbol}>☯</Text>
          <Text style={styles.zh}>命果</Text>
          <Text style={styles.en}>MINGO</Text>
          <Text style={styles.tag}>看懂變化,{"\n"}走向更好的自己</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHint}>第一次使用,請先閱讀並了解(點標題可展開):</Text>
          <ConsentItem doc={PRIVACY_CONSENT} />
          <ConsentItem doc={DISCLAIMER} />
        </View>

        <PrimaryButton title="我已了解" onPress={onAccept} style={{ marginTop: spacing.lg }} />
        <Text style={styles.foot}>按下即表示你已閱讀並同意上述聲明</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, flexGrow: 1, justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: spacing.xl },
  symbol: { fontSize: 56, color: colors.primary },
  zh: { fontSize: 32, fontWeight: "800", color: colors.text, letterSpacing: 8, marginTop: spacing.sm },
  en: { fontSize: 15, color: colors.accent, fontWeight: "700", letterSpacing: 8, marginTop: 2 },
  tag: { fontSize: 15, color: colors.subtle, textAlign: "center", lineHeight: 26, marginTop: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHint: { fontSize: 13, color: colors.subtle, marginBottom: spacing.md },
  item: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.sm },
  itemHead: { paddingVertical: 6 },
  itemTitle: { fontSize: 15, fontWeight: "700", color: colors.primary },
  body: { paddingTop: 4, paddingBottom: 6 },
  p: { fontSize: 13, color: colors.text, lineHeight: 22, marginBottom: 6 },
  foot: { fontSize: 12, color: colors.subtle, textAlign: "center", marginTop: spacing.md },
});
