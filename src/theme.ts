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

/** 五行配色(本卦/變卦標示用)。 */
export const wuxingColor: Record<string, string> = {
  木: "#2e7d32",
  火: "#c0392b",
  土: "#a9791c",
  金: "#b8860b",
  水: "#2c5d8a",
};
