import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { ApiError, forgotPassword } from "../api";
import { PRIVACY_CONSENT, DISCLAIMER } from "../legal";

type Mode = "login" | "register";

/** 可捲動的同意條文區塊 + 勾選框。 */
function ConsentBlock({
  doc,
  checked,
  onToggle,
  disabled,
}: {
  doc: { title: string; body: string[]; agree: string };
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.consentBlock}>
      <Text style={styles.consentTitle}>{doc.title}</Text>
      <ScrollView style={styles.consentBody} nestedScrollEnabled>
        {doc.body.map((p, i) => (
          <Text key={i} style={styles.consentText}>
            {p}
          </Text>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.consentCheckRow}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.consentAgree}>{doc.agree}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeDisclaimer, setAgreeDisclaimer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";
  const consentOk = agreePrivacy && agreeDisclaimer;

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError(null);
    setAgreePrivacy(false);
    setAgreeDisclaimer(false);
  }

  async function onForgot() {
    const e = email.trim().toLowerCase();
    if (!e) {
      setError("請先在上方輸入 Email,再點忘記密碼");
      return;
    }
    const done = () =>
      Alert.alert(
        "已寄出",
        "若這是已註冊的帳號,重設密碼連結已寄到信箱,請點信中連結重設(1 小時內有效)。"
      );
    try {
      await forgotPassword(e);
      done();
    } catch {
      done(); // 一律相同訊息,防帳號列舉
    }
  }

  async function onSubmit() {
    if (busy) return;
    setError(null);

    const e = email.trim().toLowerCase();
    if (!e || !password) {
      setError("請輸入 Email 與密碼");
      return;
    }
    if (isRegister) {
      if (password.length < 8) {
        setError("密碼至少需 8 個字");
        return;
      }
      if (!(/[A-Za-z]/.test(password) && /\d/.test(password))) {
        setError("密碼需英數混合(同時包含英文字母與數字)");
        return;
      }
    }
    if (isRegister && password !== password2) {
      setError("兩次輸入的密碼不一致");
      return;
    }
    if (isRegister && !consentOk) {
      setError("請先閱讀並勾選個資使用同意書與免責聲明");
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
              placeholder={isRegister ? "至少 8 碼,英數混合" : "請輸入密碼"}
              placeholderTextColor={colors.subtle}
              secureTextEntry
              autoCapitalize="none"
              textContentType={isRegister ? "newPassword" : "password"}
              editable={!busy}
            />

            {isRegister && (
              <>
                <Text style={styles.label}>再次輸入密碼</Text>
                <TextInput
                  style={styles.input}
                  value={password2}
                  onChangeText={setPassword2}
                  placeholder="再輸入一次密碼"
                  placeholderTextColor={colors.subtle}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  editable={!busy}
                />

                <Text style={styles.label}>暱稱(選填)</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="顯示名稱"
                  placeholderTextColor={colors.subtle}
                  editable={!busy}
                />

                <ConsentBlock
                  doc={PRIVACY_CONSENT}
                  checked={agreePrivacy}
                  onToggle={() => setAgreePrivacy((v) => !v)}
                  disabled={busy}
                />
                <ConsentBlock
                  doc={DISCLAIMER}
                  checked={agreeDisclaimer}
                  onToggle={() => setAgreeDisclaimer((v) => !v)}
                  disabled={busy}
                />
              </>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.button,
                (busy || (isRegister && !consentOk)) && styles.buttonDisabled,
              ]}
              onPress={onSubmit}
              disabled={busy || (isRegister && !consentOk)}
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

            {!isRegister && (
              <TouchableOpacity style={styles.switch} onPress={onForgot} disabled={busy}>
                <Text style={styles.forgotText}>忘記密碼?</Text>
              </TouchableOpacity>
            )}

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
  consentBlock: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.bg,
  },
  consentTitle: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontWeight: "700",
    fontSize: 13,
    color: "#5a3a2a",
    backgroundColor: "#f0ece4",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  consentBody: { maxHeight: 130, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  consentText: { fontSize: 12, lineHeight: 19, color: "#444", marginBottom: 5 },
  consentCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.subtle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxTick: { color: colors.primaryText, fontSize: 14, fontWeight: "800" },
  consentAgree: { flex: 1, fontSize: 13, color: colors.text },
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
  forgotText: { color: colors.subtle, fontSize: 14 },
});
