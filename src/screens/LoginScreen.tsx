import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { useAuth } from "../AuthContext";
import { ApiError } from "../api";

type Mode = "login" | "register";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError(null);
  }

  async function onSubmit() {
    if (busy) return;
    setError(null);

    const e = email.trim().toLowerCase();
    if (!e || !password) {
      setError("請輸入 Email 與密碼");
      return;
    }
    if (isRegister && password.length < 6) {
      setError("密碼至少需 6 個字");
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        await register(e, password, displayName.trim() || undefined);
      } else {
        await login(e, password);
      }
      // 成功後 AuthContext 會更新 user,App 自動切換到內容畫面
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "發生未知錯誤,請稍後再試"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.top}>
            <Text style={styles.symbol}>☯</Text>
            <Text style={styles.title}>命卦排盤</Text>
            <Text style={styles.subtitle}>
              {isRegister ? "註冊新會員" : "會員登入"}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.subtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!busy}
            />

            <Text style={styles.label}>密碼</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isRegister ? "至少 6 個字" : "請輸入密碼"}
              placeholderTextColor={colors.subtle}
              secureTextEntry
              autoCapitalize="none"
              textContentType={isRegister ? "newPassword" : "password"}
              editable={!busy}
            />

            {isRegister && (
              <>
                <Text style={styles.label}>暱稱(選填)</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="顯示名稱"
                  placeholderTextColor={colors.subtle}
                  editable={!busy}
                />
              </>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? "註冊" : "登入"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switch}
              onPress={switchMode}
              disabled={busy}
            >
              <Text style={styles.switchText}>
                {isRegister
                  ? "已經有帳號了?改用登入"
                  : "還沒有帳號?立即註冊"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  top: { alignItems: "center", marginBottom: spacing.xl },
  symbol: { fontSize: 56, color: colors.primary },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.subtle,
    marginTop: spacing.sm,
    letterSpacing: 4,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  label: {
    fontSize: 13,
    color: colors.subtle,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  error: {
    color: colors.moving,
    fontSize: 14,
    marginTop: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 2,
  },
  switch: { alignItems: "center", marginTop: spacing.lg },
  switchText: { color: colors.primary, fontSize: 14 },
});
