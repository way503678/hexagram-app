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

/** 「探索」分頁內的功能頁；保留底部分頁列，方便隨時切換功能。 */
export type FeaturesStackParamList = {
  FeaturesHome: undefined;
  Almanac: undefined;
};

/** 外層 Stack:主分頁 + 可由多個分頁進入的卜卦頁。 */
export type RootStackParamList = {
  Tabs: undefined;
  Cast: { mode: CastMode; autoBirth?: AutoBirth };
};
