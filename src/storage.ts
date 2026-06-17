/**
 * 跨平台的小型安全儲存包裝。
 *
 * - 原生(iOS/Android):用 expo-secure-store,token 存在系統 Keychain/Keystore,加密。
 * - Web(Expo web 預覽):SecureStore 不支援,退回 localStorage。
 *
 * 只用來存登入 token 這類小字串。
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const isWeb = Platform.OS === "web";

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* localStorage 可能在隱私模式被擋,忽略 */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* 忽略 */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
