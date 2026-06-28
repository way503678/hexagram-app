/**
 * 命果 MINGO 設計系統 — 色彩 / 間距 / 圓角。
 * 基準文件:hexagram/docs/DESIGN_SYSTEM.md(改風格先改那份,再同步此檔)。
 * 低飽和紫色系 + 米白底 + 大圓角 + 柔和陰影 + 漸層。
 */
export const colors = {
  // --- MINGO tokens(對齊 Dev Kit v1:暖奶白 + 深紫 + 薰衣草 + 金 + 鼠尾草)---
  bg: "#FFF9F4", // 頁面背景(creamLight)
  cream: "#F7F4EE", // 中階奶白
  surface: "#FBF6EF", // 暖色面板
  card: "#FFFFFF", // 卡片(elevated)
  border: "#EAE4DC", // 分隔線(divider)
  text: "#3C3442", // 主文字(暖深)
  subtle: "#8D8190", // 次要文字
  primary: "#5E548E", // 次色 中紫
  primaryDark: "#2B2D42", // 主色 深紫藍
  primaryText: "#FFFFFF",
  accent: "#A78BFA", // 強調 薰衣草紫(soft purple)
  lavender: "#E9DDF7", // 淡薰衣草(底色/標籤)
  gold: "#F6BD60", // 點綴 金黃
  goldSoft: "#F9D9A6", // 柔金
  sage: "#A8C9B3", // 鼠尾草綠
  sageDeep: "#6E8D7D",
  // --- 命理功能色(換膚不動,維持判讀正確性)---
  moving: "#c0392b", // 動爻
  shi: "#1f6f43", // 世
  ying: "#2c5d8a", // 應
};

/** 紫色漸層(深紫卡 / 亮紫卡 / 淺底),配 expo-linear-gradient 的 colors 陣列。 */
export const gradients = {
  deep: ["#5E548E", "#2B2D42"] as const, // 深紫卡
  bright: ["#A78BFA", "#5E548E"] as const, // 亮紫卡
  light: ["#FFF9F4", "#FFFFFF"] as const, // 淺底
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** 圓角(對齊 Dev Kit)。 */
export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

/** 柔和陰影(soft)— 對齊 Dev Kit(大而淡)。 */
export const shadowSoft = {
  shadowColor: "#2B2D42",
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.1,
  shadowRadius: 32,
  elevation: 4,
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
