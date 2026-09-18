import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  useFonts,
  CormorantGaramond_500Medium,
} from "@expo-google-fonts/cormorant-garamond";
import { FeaturesStackParamList, RootStackParamList, RootTabParamList } from "./src/navTypes";
import HomeScreen from "./src/screens/HomeScreen";
import FeaturesScreen from "./src/screens/FeaturesScreen";
import AlmanacScreen from "./src/screens/AlmanacScreen";
import CastScreen from "./src/screens/CastScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MemberScreen from "./src/screens/MemberScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { colors } from "./src/theme";
import MingoIcon, { MingoIconName } from "./src/components/MingoIcon";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const FeaturesStack = createNativeStackNavigator<FeaturesStackParamList>();

/** 一般分頁圖示（v4 線條圖示，未選取時降透明度）。 */
function tabIcon(name: MingoIconName) {
  return ({ focused }: { focused: boolean }) => (
    <MingoIcon name={name} size={26} style={{ opacity: focused ? 1 : 0.45 }} />
  );
}

/**
 * 探索分頁自己的頁面堆疊。萬年曆留在分頁內，進入後底部導覽仍可使用。
 */
function FeaturesNavigator() {
  return (
    <FeaturesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <FeaturesStack.Screen
        name="FeaturesHome"
        component={FeaturesScreen}
        options={{ headerShown: false }}
      />
      <FeaturesStack.Screen
        name="Almanac"
        component={AlmanacScreen}
        options={{ title: "今日黃曆" }}
      />
    </FeaturesStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navIdle,
        tabBarStyle: {
          height: 78,
          backgroundColor: colors.bg,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 10,
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
        component={FeaturesNavigator}
        options={{ title: "探索", headerShown: false, tabBarIcon: tabIcon("explore") }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "首頁",
          headerShown: false,
          tabBarIcon: tabIcon("home"),
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
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
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
});
