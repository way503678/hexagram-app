/** 命果 MINGO v3 圖示(暖紫金 tile 風,彩色點陣,直接當 Image 用)。 */
import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

const ICONS = {
  bagua: require("../../assets/mingo/icons/bagua.png"),
  calendar: require("../../assets/mingo/icons/calendar.png"),
  chat: require("../../assets/mingo/icons/chat.png"),
  coin: require("../../assets/mingo/icons/coin.png"),
  fortune: require("../../assets/mingo/icons/fortune.png"),
  heart: require("../../assets/mingo/icons/heart.png"),
  history: require("../../assets/mingo/icons/history.png"),
  home: require("../../assets/mingo/icons/home.png"),
  lock: require("../../assets/mingo/icons/lock.png"),
  moon: require("../../assets/mingo/icons/moon.png"),
  oracle: require("../../assets/mingo/icons/oracle.png"),
  profile: require("../../assets/mingo/icons/profile.png"),
  settings: require("../../assets/mingo/icons/settings.png"),
  star: require("../../assets/mingo/icons/star.png"),
  sun: require("../../assets/mingo/icons/sun.png"),
  wallet: require("../../assets/mingo/icons/wallet.png"),
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
