/** 導覽參數型別(React Navigation 底部分頁)。 */
export type CastMode = "coin" | "time";

/** 從會員中心「查看我的命盤」帶過去的生日(自動排盤用)。 */
export type AutoBirth = { y: number; m: number; d: number; h: number; name?: string };

export type RootTabParamList = {
  Home: undefined;
  Almanac: undefined;
  Coin: undefined;
  Time: { autoBirth?: AutoBirth } | undefined;
  Member: undefined;
};
