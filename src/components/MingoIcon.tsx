/** 命果 MINGO v3 圖示(暖紫金 tile 風,彩色點陣,直接當 Image 用)。 */
import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

const ICONS = {
  bagua: require("../../assets/mingo/icons/bagua@3x.png"),
  calendar: require("../../assets/mingo/icons/calendar@3x.png"),
  chat: require("../../assets/mingo/icons/chat@3x.png"),
  coin: require("../../assets/mingo/icons/coin@3x.png"),
  fortune: require("../../assets/mingo/icons/fortune@3x.png"),
  heart: require("../../assets/mingo/icons/heart@3x.png"),
  history: require("../../assets/mingo/icons/history@3x.png"),
  home: require("../../assets/mingo/icons/home@3x.png"),
  lock: require("../../assets/mingo/icons/lock@3x.png"),
  moon: require("../../assets/mingo/icons/moon@3x.png"),
  oracle: require("../../assets/mingo/icons/oracle@3x.png"),
  profile: require("../../assets/mingo/icons/profile@3x.png"),
  settings: require("../../assets/mingo/icons/settings@3x.png"),
  star: require("../../assets/mingo/icons/star@3x.png"),
  sun: require("../../assets/mingo/icons/sun@3x.png"),
  wallet: require("../../assets/mingo/icons/wallet@3x.png"),
} as const;

export type MingoIconName = keyof typeof ICONS;

export default function MingoIcon({
  name,
  size = 28,
  style,
}: {
  name: MingoIconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return <Image source={ICONS[name]} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
