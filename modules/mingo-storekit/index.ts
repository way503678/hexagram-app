import { requireOptionalNativeModule } from "expo-modules-core";

type MingoStoreKitNative = {
  getSignedAppTransaction(): Promise<string | null>;
};

const native = requireOptionalNativeModule<MingoStoreKitNative>("MingoStoreKit");

/** 只有 App Store iOS build 可取得；Expo Go、Web、Android 會安全回傳 null。 */
export async function getSignedAppTransaction(): Promise<string | null> {
  if (!native) return null;
  try {
    return await native.getSignedAppTransaction();
  } catch {
    return null;
  }
}
