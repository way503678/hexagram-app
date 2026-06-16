import React from "react";
import { Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "./src/navTypes";
import HomeScreen from "./src/screens/HomeScreen";
import AlmanacScreen from "./src/screens/AlmanacScreen";
import CastScreen from "./src/screens/CastScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator<RootTabParamList>();

/** 用 emoji 當分頁圖示(隨選取狀態調整透明度)。 */
function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.subtle,
            tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "700" },
            headerShadowVisible: false,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "首頁", headerShown: false, tabBarIcon: tabIcon("☯") }}
          />
          <Tab.Screen
            name="Almanac"
            component={AlmanacScreen}
            options={{ title: "萬年曆", tabBarIcon: tabIcon("📅") }}
          />
          <Tab.Screen
            name="Coin"
            options={{ title: "手動擲卦", tabBarIcon: tabIcon("🪙") }}
          >
            {() => <CastScreen mode="coin" />}
          </Tab.Screen>
          <Tab.Screen
            name="Time"
            options={{ title: "命盤排卦", tabBarIcon: tabIcon("🕐") }}
          >
            {() => <CastScreen mode="time" />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
