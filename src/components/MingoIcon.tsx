/** 命果 MINGO v4 圖示（深靛藍線條風，文字標籤由介面原生渲染）。 */
import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

const ICONS = {
  share: require("../../assets/mingo/icons-v4/share.png"),
  explore: require("../../assets/mingo/icons-v4/explore.png"),
  chart: require("../../assets/mingo/icons-v4/chart.png"),
  shop: require("../../assets/mingo/icons-v4/shop.png"),
  qa: require("../../assets/mingo/icons-v4/qa.png"),
  profile: require("../../assets/mingo/icons-v4/profile.png"),
  guide: require("../../assets/mingo/icons-v4/guide.png"),
  favorite: require("../../assets/mingo/icons-v4/favorite.png"),
  fortune: require("../../assets/mingo/icons-v4/fortune.png"),
  divination: require("../../assets/mingo/icons-v4/divination.png"),
  history: require("../../assets/mingo/icons-v4/history.png"),
  settings: require("../../assets/mingo/icons-v4/settings.png"),
  notification: require("../../assets/mingo/icons-v4/notification.png"),
  relationship: require("../../assets/mingo/icons-v4/relationship.png"),
  home: require("../../assets/mingo/icons-v4/home.png"),
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
