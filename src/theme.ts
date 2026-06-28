/**
 * 命果 MINGO 設計系統 — 色彩 / 間距 / 圓角。
 * 基準文件:hexagram/docs/DESIGN_SYSTEM.md(改風格先改那份,再同步此檔)。
 * 低飽和紫色系 + 米白底 + 大圓角 + 柔和陰影 + 漸層。
 */
export const colors = {
  // --- MINGO tokens(對齊「首頁設計規範」:暖米底 + 靜謐藍紫 + 微光金)---
  bg: "#F1E9DC", // 頁面背景(暖米;漸層主調,見 gradients.page)
  cream: "#F5EFE4", // 漸層最亮端
  surface: "#EDE5D7", // 暖色面板
  card: "#FFFFFF", // 卡片(white)
  border: "rgba(120,104,160,0.16)", // 分隔線(淡紫)
  text: "#2C2942", // 主文字 / 標題(墨紫)
  body: "#5D5675", // 內文段落
  subtle: "#6B6385", // 次要 / 提示文字
  faint: "#8C84A6", // 弱化標籤 / latin 標語
  primary: "#6F5E9B", // 主紫
  primaryDark: "#2C2942", // 最深(墨紫)
  primaryText: "#FFFFFF",
  accent: "#8A79B3", // 強調 / 主漸層淺端
  navIdle: "#9A93AD", // 導覽未選
  lavender: "#D8C6EE", // 薰衣草
  lavenderLight: "#F3EEF9",
  gold: "#E9B34A", // 微光金
  goldSoft: "#F6DFA6", // 柔金
  peach: "#F2C6AD",
  rose: "#DFA7B4",
  sage: "#AFC7A4", // 鼠尾草綠
  // --- 命理功能色(換膚不動,維持判讀正確性)---
  moving: "#c0392b", // 動爻
  shi: "#1f6f43", // 世
  ying: "#2c5d8a", // 應
};

/** 漸層,配 expo-linear-gradient 的 colors 陣列。 */
export const gradients = {
  page: ["#F5EFE4", "#F1E9DC", "#E9E0D2"] as const, // 全頁背景(上→下暖米)
  primary: ["#8A79B3", "#6F5E9B"] as const, // 主按鈕(135deg)
  frosted: ["rgba(255,253,250,0.85)", "rgba(232,226,240,0.78)"] as const, // 霧面卡(160deg)
  deep: ["#6F5E9B", "#2C2942"] as const, // 深紫卡(plum→ink)
  bright: ["#8A79B3", "#6F5E9B"] as const, // 亮紫卡
  gold: ["#F6DFA6", "#E9B34A"] as const, // 金卡
  light: ["#F5EFE4", "#FFFFFF"] as const, // 淺底
};

/** 字體 — 中文走系統字;latin 標語 / MINGO 字樣走 Cormorant。 */
export const fonts = { serif: "CormorantGaramond_500Medium" };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** 圓角(對齊規範:卡片26 / 按鈕22 / 小元件16-18)。 */
export const radius = {
  sm: 14,
  md: 18,
  btn: 22, // 按鈕
  card: 26, // 卡片
  lg: 26, // = 卡片(沿用 lg 引用)
  xl: 32,
  pill: 999,
};

/** 卡片柔和陰影 — 規範:0 14 34 rgba(95,82,135,.2)。 */
export const shadowSoft = {
  shadowColor: "#5F5287",
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.2,
  shadowRadius: 34,
  elevation: 6,
};

/** 按鈕陰影 — 規範:0 6 16 rgba(111,94,155,.35)。 */
export const shadowBtn = {
  shadowColor: "#6F5E9B",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
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
