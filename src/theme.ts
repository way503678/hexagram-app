/** 簡單的色彩 / 間距常數,讓畫面風格一致。 */
export const colors = {
  bg: "#f5f3ef",
  card: "#ffffff",
  border: "#e3ddd2",
  text: "#2b2620",
  subtle: "#8a8275",
  primary: "#6b2d8b", // 與網頁 AI 按鈕同色系
  primaryText: "#ffffff",
  accent: "#b8860b",
  moving: "#c0392b", // 動爻
  shi: "#1f6f43", // 世
  ying: "#2c5d8a", // 應
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
