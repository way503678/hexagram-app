/** 導覽參數型別(React Navigation native-stack)。 */
export type CastMode = "coin" | "time";

export type RootStackParamList = {
  Home: undefined;
  Cast: { mode: CastMode };
};
