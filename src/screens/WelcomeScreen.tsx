/**
 * 品牌落地頁(未登入第一畫面)。
 * 畫面只有 logo + slogan;首次開啟自動彈「個資 + 免責」同意 Modal,
 * 按過一次後記到本機(mingo_consent_v1),之後不再出現。
 * 同意後才顯示「登入 / 註冊」入口按鈕。
 */
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fonts } from "../theme";
import { PrimaryButton, GhostButton } from "../components/ui";
import { PRIVACY_CONSENT, DISCLAIMER } from "../legal";
import { getItem, setItem } from "../storage";

const BG = require("../../assets/mingo/splash_background.png");
const CONSENT_KEY = "mingo_consent_v1";

type Mode = "login" | "register";

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

export default function WelcomeScreen({ onEnter }: { onEnter: (mode: Mode) => void }) {
  // null = 還在讀本機旗標;true/false = 是否已同意過
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    getItem(CONSENT_KEY).then((v) => setConsent(v === "1"));
  }, []);

  function accept() {
    setItem(CONSENT_KEY, "1");
    setConsent(true);
  }

  return (
    <ImageBackground source={BG} style={styles.safe} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.brand}>
            <Text style={styles.symbol}>☯</Text>
            <Text style={styles.zh}>命果</Text>
            <Text style={styles.en}>MINGO</Text>
            <Text style={styles.tag}>看懂變化,{"\n"}走向更好的自己</Text>
          </View>

          {/* 同意後才出現登入 / 註冊入口 */}
          {consent && (
            <View style={styles.actions}>
              <PrimaryButton title="登入" onPress={() => onEnter("login")} />
              <GhostButton
                title="註冊新帳號"
                onPress={() => onEnter("register")}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* 首次開啟:同意書 Modal */}
      <Modal visible={consent === false} animationType="fade" transparent>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>第一次使用,請先閱讀並了解</Text>
            <Text style={styles.sheetHint}>點標題可展開內容</Text>
            <ScrollView style={styles.sheetScroll}>
              <ConsentItem doc={PRIVACY_CONSENT} />
              <ConsentItem doc={DISCLAIMER} />
            </ScrollView>
            <PrimaryButton
              title="我已閱讀並同意"
              onPress={accept}
              style={{ marginTop: spacing.lg }}
            />
            <Text style={styles.foot}>按下即表示你已閱讀並同意上述聲明</Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, justifyContent: "center", padding: spacing.xl },
  brand: { alignItems: "center" },
  symbol: { fontSize: 56, color: colors.primary },
  zh: { fontSize: 32, fontWeight: "800", color: colors.text, letterSpacing: 8, marginTop: spacing.sm },
  en: { fontSize: 16, color: colors.faint, letterSpacing: 8, marginTop: 2, fontFamily: fonts.serif },
  tag: { fontSize: 15, color: colors.subtle, textAlign: "center", lineHeight: 26, marginTop: spacing.md },
  actions: { marginTop: spacing.xl * 2 },
  // 同意 Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(43,45,66,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    maxHeight: "82%",
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  sheetHint: { fontSize: 12, color: colors.subtle, marginTop: 4, marginBottom: spacing.sm },
  sheetScroll: { flexGrow: 0 },
  item: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.sm },
  itemHead: { paddingVertical: 6 },
  itemTitle: { fontSize: 15, fontWeight: "700", color: colors.primary },
  body: { paddingTop: 4, paddingBottom: 6 },
  p: { fontSize: 13, color: colors.text, lineHeight: 22, marginBottom: 6 },
  foot: { fontSize: 12, color: colors.subtle, textAlign: "center", marginTop: spacing.md },
});
