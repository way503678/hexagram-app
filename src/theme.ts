/**
 * 命果 MINGO 設計系統 — 色彩 / 間距 / 圓角。
 * 基準文件:hexagram/docs/DESIGN_SYSTEM.md(改風格先改那份,再同步此檔)。
 * 低飽和紫色系 + 米白底 + 大圓角 + 柔和陰影 + 漸層。
 */
export const colors = {
  // --- MINGO tokens(對齊 Production Resources v3:暖紫 + 金 + 奶白命理風)---
  bg: "#FFF8EF", // 頁面背景(cream)
  cream: "#FFF8EF",
  surface: "#FBF3E8", // 暖色面板(paper)
  card: "#FFFFFF", // 卡片(white)
  border: "#ECE3D7", // 分隔線(暖奶白)
  text: "#3E2A3F", // 主文字(ink 暖墨紫)
  subtle: "#8C7C8A", // 次要文字
  primary: "#6F4C8B", // 主紫(plum)
  primaryDark: "#3E2A3F", // 最深(ink)
  primaryText: "#FFFFFF",
  accent: "#9B78C7", // 強調紫(purple)
  lavender: "#D8C6EE", // 薰衣草
  lavenderLight: "#F3EEF9",
  gold: "#D8A84E", // 金
  goldSoft: "#F6DFA6", // 柔金(goldLight)
  peach: "#F2C6AD",
  rose: "#DFA7B4",
  sage: "#AFC7A4", // 鼠尾草綠
  // --- 命理功能色(換膚不動,維持判讀正確性)---
  moving: "#c0392b", // 動爻
  shi: "#1f6f43", // 世
  ying: "#2c5d8a", // 應
};

/** 紫色漸層(深紫卡 / 亮紫卡 / 淺底),配 expo-linear-gradient 的 colors 陣列。 */
export const gradients = {
  deep: ["#6F4C8B", "#3E2A3F"] as const, // 深紫卡(plum→ink)
  bright: ["#9B78C7", "#6F4C8B"] as const, // 亮紫卡(purple→plum)
  gold: ["#F6DFA6", "#D8A84E"] as const, // 金卡
  light: ["#FFF8EF", "#FFFFFF"] as const, // 淺底
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** 圓角(對齊 v3:sm12/md20/lg32/xl48)。 */
export const radius = {
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
  pill: 999,
};

/** 柔和陰影(soft)— 對齊 v3(暖墨紫、大而淡)。 */
export const shadowSoft = {
  shadowColor: "#3E2A3F",
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.16,
  shadowRadius: 28,
  elevation: 5,
};

/** 紫白飛星徽章配色:{背景, 文字, 是否描邊}。 */
export const zibaiStyle: Record<number, { bg: string; fg: string; border?: boolean }> = {
  1: { bg: "#ffffff", fg: "#2c5d8a", border: true },
  2: { bg: "#1b1b1b", fg: "#ffffff" },
  3: { bg: "#2e74c9", fg: "#ffffff" },
  4: { bg: "#3a9d3a", fg: "#ffffff" },
  5: { bg: "#e0a800", fg: "#ffffff" },
  6: { bg: "#ffffff", fg: "#333333", border: true },
  7: { bg: "#d13b35", fg: "#ffffff" },
  8: { bg: "#ffffff", fg: "#333333", border: true },
  9: { bg: "#7a3b9e", fg: "#ffffff" },
};

/** 擇日吉凶配色。 */
export const zeriColor: Record<string, string> = {
  大吉: "#c62828",
  吉: "#2e7d32",
  小吉: "#7cb342",
  平: "#9e9e9e",
  凶: "#d97706",
  大凶: "#5d4037",
};

/** 天干五行配色(干支用)。 */
export function ganColor(gan: string): string {
  if ("甲乙".includes(gan)) return "#2e7d32";
  if ("丙丁".includes(gan)) return "#c0392b";
  if ("戊己".includes(gan)) return "#a9791c";
  if ("庚辛".includes(gan)) return "#b8860b";
  return "#2c5d8a";
}

/** 五行配色(本卦/變卦標示用)。 */
export const wuxingColor: Record<string, string> = {
  木: "#2e7d32",
  火: "#c0392b",
  土: "#a9791c",
  金: "#b8860b",
  水: "#2c5d8a",
};
