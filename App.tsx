import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  CormorantGaramond_500Medium,
} from "@expo-google-fonts/cormorant-garamond";
import { RootStackParamList, RootTabParamList } from "./src/navTypes";
import HomeScreen from "./src/screens/HomeScreen";
import FeaturesScreen from "./src/screens/FeaturesScreen";
import AlmanacScreen from "./src/screens/AlmanacScreen";
import CastScreen from "./src/screens/CastScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MemberScreen from "./src/screens/MemberScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { colors, gradients, shadowSoft } from "./src/theme";
import MingoIcon, { MingoIconName } from "./src/components/MingoIcon";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/** 一般分頁圖示(v3 tile 圖示,未選取降透明度)。 */
function tabIcon(name: MingoIconName) {
  return ({ focused }: { focused: boolean }) => (
    <MingoIcon name={name} size={26} style={{ opacity: focused ? 1 : 0.45 }} />
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
        tabBarInactiveTintColor: colors.navIdle,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          height: 62,
          borderRadius: 28,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          ...shadowSoft,
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
        options={{ title: "功能", headerShown: false, tabBarIcon: tabIcon("bagua") }}
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
        options={{ title: "我的", headerShown: false, tabBarIcon: tabIcon("profile") }}
      />
    </Tab.Navigator>
  );
}

/**
 * 依登入狀態決定顯示:
 *   載入中 → 轉圈;
 *   已登入 → 直接進主分頁(不再經過登入畫面);
 *   未登入 → 落地頁(logo+slogan,首次彈同意書)→ 選登入/註冊 → LoginScreen。
 */
function Root() {
  const { user, loading } = useAuth();
  const [entry, setEntry] = useState<"login" | "register" | null>(null);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
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
      ) : entry ? (
        <LoginScreen initialMode={entry} onBack={() => setEntry(null)} />
      ) : (
        <WelcomeScreen onEnter={setEntry} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ CormorantGaramond_500Medium });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        <AuthProvider>
          <Root />
        </AuthProvider>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
