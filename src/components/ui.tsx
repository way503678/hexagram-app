/**
 * 命果 MINGO 共用 UI 元件。
 * 設計基準:hexagram/docs/DESIGN_SYSTEM.md(低飽和紫 + 米白 + 大圓角 + 柔和陰影 + 漸層)。
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, shadowSoft, spacing } from "../theme";

/** 可指定漸層的圓角卡。variant: deep(深紫) / bright(亮紫) / light(淺底)。 */
export function GradientCard({
  children,
  variant = "deep",
  style,
}: {
  children?: React.ReactNode;
  variant?: keyof typeof gradients;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      colors={gradients[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientCard, shadowSoft, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** 白底圓角卡(soft 陰影)。 */
export function SectionCard({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.sectionCard, shadowSoft, style]}>{children}</View>;
}

/** 膠囊分類標籤。selected 時填主色。 */
export function PillTag({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillOn : styles.pillOff]}
    >
      <Text style={[styles.pillText, selected ? styles.pillTextOn : styles.pillTextOff]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 主要按鈕(亮紫填色)。 */
export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.btnPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Text style={styles.primaryBtnText}>{title}</Text>
      )}
    </Pressable>
  );
}

/** 次要按鈕(描邊、透明底)。 */
export function GhostButton({
  title,
  onPress,
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ghostBtn,
        disabled && styles.btnDisabled,
        pressed && !disabled && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={styles.ghostBtnText}>{title}</Text>
    </Pressable>
  );
}

/** 左 icon + 標題 + 右值(幸運方向 / 色 / 數字)。 */
export function IconRow({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon?: string;
  label: string;
  value: string;
  valueStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.iconRow}>
      <View style={styles.iconRowLeft}>
        {icon ? <Text style={styles.iconRowIcon}>{icon}</Text> : null}
        <Text style={styles.iconRowLabel}>{label}</Text>
      </View>
      <Text style={[styles.iconRowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  pillOn: { backgroundColor: colors.primary },
  pillOff: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  pillText: { fontSize: 14, fontWeight: "600" },
  pillTextOn: { color: colors.primaryText },
  pillTextOff: { color: colors.subtle },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.primaryText, fontSize: 15, fontWeight: "700", letterSpacing: 1 },
  ghostBtn: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: "transparent",
  },
  ghostBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700", letterSpacing: 1 },
  btnDisabled: { opacity: 0.45 },
  btnPressed: { opacity: 0.85 },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconRowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconRowIcon: { fontSize: 17 },
  iconRowLabel: { fontSize: 15, color: colors.subtle },
  iconRowValue: { fontSize: 15, fontWeight: "700", color: colors.text },
});
