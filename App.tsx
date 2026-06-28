import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList, RootTabParamList } from "./src/navTypes";
import HomeScreen from "./src/screens/HomeScreen";
import FeaturesScreen from "./src/screens/FeaturesScreen";
import AlmanacScreen from "./src/screens/AlmanacScreen";
import CastScreen from "./src/screens/CastScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MemberScreen from "./src/screens/MemberScreen";
import SplashConsent from "./src/screens/SplashConsent";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { getItem, setItem } from "./src/storage";
import { colors, gradients } from "./src/theme";

const CONSENT_KEY = "mingo_consent_v1";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/** 一般分頁圖示(emoji,依選取狀態調整透明度)。 */
function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

/** 中央「首頁」凸起按鈕(Apple Music 風)。 */
function CenterTabButton({
  onPress,
  accessibilityState,
}: {
  onPress?: (e: unknown) => void;
  accessibilityState?: { selected?: boolean };
}) {
  const focused = !!accessibilityState?.selected;
  return (
    <View style={styles.centerWrap} pointerEvents="box-none">
      <Pressable onPress={onPress as (e: unknown) => void} style={styles.centerPress}>
        <LinearGradient
          colors={gradients.bright}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.centerBtn, focused && styles.centerBtnOn]}
        >
          <Text style={styles.centerIcon}>☯</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700", letterSpacing: 1 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Features"
        component={FeaturesScreen}
        options={{ title: "功能", headerShown: false, tabBarIcon: tabIcon("☷") }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "",
          headerShown: false,
          tabBarButton: (props) => <CenterTabButton {...(props as object)} />,
        }}
      />
      <Tab.Screen
        name="Member"
        component={MemberScreen}
        options={{ title: "我的", headerShown: false, tabBarIcon: tabIcon("👤") }}
      />
    </Tab.Navigator>
  );
}

/** 依登入狀態決定顯示:載入中 → 轉圈;未登入 → 登入頁;已登入 → 主分頁 + 功能頁堆疊。 */
function Root() {
  const { user, loading } = useAuth();
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    getItem(CONSENT_KEY).then((v) => setConsent(v === "1"));
  }, []);

  if (consent === null || loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 首次開啟:先看同意書
  if (!consent) {
    return (
      <SplashConsent
        onAccept={() => {
          setItem(CONSENT_KEY, "1");
          setConsent(true);
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "700" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Almanac" component={AlmanacScreen} options={{ title: "今日黃曆" }} />
          <Stack.Screen
            name="Cast"
            component={CastScreen}
            options={({ route }) => ({
              title: route.params?.mode === "time" ? "命盤排卦" : "卜卦問事",
            })}
          />
        </Stack.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "flex-start" },
  centerPress: { top: -16, alignItems: "center" },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  centerBtnOn: { borderColor: colors.gold },
  centerIcon: { fontSize: 28, color: "#fff" },
});
