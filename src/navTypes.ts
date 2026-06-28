/** 導覽參數型別。 */
export type CastMode = "coin" | "time";

/** 從會員中心「查看我的命盤」帶過去的生日(自動排盤用)。 */
export type AutoBirth = {
  y: number; m: number; d: number; h: number;
  name?: string; gender?: "M" | "F" | "";
};

/** 底部 3 分頁:功能 / 首頁(中央) / 我的。 */
export type RootTabParamList = {
  Features: undefined;
  Home: undefined;
  Member: undefined;
};

/** 外層 Stack:分頁 + 推入的功能頁(黃曆 / 卜卦)。 */
export type RootStackParamList = {
  Tabs: undefined;
  Almanac: undefined;
  Cast: { mode: CastMode; autoBirth?: AutoBirth };
};
