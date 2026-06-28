/**
 * 命果 MINGO 教練式解讀渲染(Mingo 1.0)。
 * 解析後端回傳的【標記】分段:①一句話=亮紫卡、⑨陪你一句=金色收尾、
 * ④易經原文/⑤深入理論=可收合,其餘=一般段落。
 * 與網頁 manual.html 的 renderMingo 同邏輯,兩平台一致。
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { GradientCard } from "./ui";

const COLLAPSE = new Set(["易經原文", "深入理論"]);

type Section = { title: string; body: string };

function parseSections(text: string): Section[] {
  const re = /【([^】]+)】/g;
  const marks: { title: string; idx: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) marks.push({ title: m[1].trim(), idx: m.index, end: re.lastIndex });
  if (!marks.length) return [{ title: "", body: text.trim() }];
  return marks.map((mk, i) => {
    const bodyEnd = i + 1 < marks.length ? marks[i + 1].idx : text.length;
    const body = text
      .slice(mk.end, bodyEnd)
      .replace(/\*\*/g, "") // 去粗體
      .replace(/（[^）]*展開[^）]*）/g, "") // 去「(點開展開)」
      .replace(/^[\s:：]*\n?/, "") // 去開頭冒號/空白
      .replace(/\s*-{3,}\s*$/, "") // 去結尾分隔線
      .trim();
    return { title: mk.title, body };
  });
}

function Collapsible({ title, body }: Section) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.collapse}>
      <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8}>
        <Text style={styles.collapseSummary}>
          {open ? "▾ " : "▸ "}
          {title}
        </Text>
      </Pressable>
      {open ? <Text style={styles.collapseBody}>{body}</Text> : null}
    </View>
  );
}

export default function MingoReading({ text }: { text: string }) {
  const sections = parseSections(text);
  return (
    <View>
      {sections.map((s, i) => {
        if (COLLAPSE.has(s.title)) return <Collapsible key={i} title={s.title} body={s.body} />;
        if (s.title === "一句話")
          return (
            <GradientCard key={i} variant="bright" style={styles.oneliner}>
              <Text style={styles.onelinerText}>{s.body}</Text>
            </GradientCard>
          );
        if (s.title === "陪你一句")
          return (
            <View key={i} style={styles.encourage}>
              <Text style={styles.encourageText}>✦ {s.body}</Text>
            </View>
          );
        return (
          <View key={i} style={styles.sec}>
            {s.title ? <Text style={styles.h}>{s.title}</Text> : null}
            <Text style={styles.body}>{s.body}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sec: { marginBottom: spacing.md },
  h: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    color: colors.primary,
    marginBottom: 5,
  },
  body: { fontSize: 15, lineHeight: 26, color: colors.text },
  oneliner: { marginBottom: spacing.md },
  onelinerText: { color: "#fff", fontSize: 17, fontWeight: "600", lineHeight: 27 },
  encourage: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    backgroundColor: "#FBF8FF",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    marginTop: spacing.md,
  },
  encourageText: { color: colors.primaryDark, fontSize: 15, lineHeight: 24 },
  collapse: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  collapseSummary: { fontWeight: "700", color: colors.primary, fontSize: 14, letterSpacing: 1 },
  collapseBody: { fontSize: 14, lineHeight: 23, color: "#4a4862", marginTop: 8 },
});
