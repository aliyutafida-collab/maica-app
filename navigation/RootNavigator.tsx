import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "./MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import AddProductScreen from "@/screens/AddProductScreen";
import AddSaleScreen from "@/screens/AddSaleScreen";
import AddExpenseScreen from "@/screens/AddExpenseScreen";
import AIAdvisorScreen from "@/screens/AIAdvisorScreen";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  AddProduct: { productId?: string } | undefined;
  AddSale: undefined;
  AddExpense: undefined;
  AIAdvisor: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="AddSale" component={AddSaleScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="AIAdvisor" component={AIAdvisorScreen} />
          </Stack.Group>
        </>
      ) : (
        <Stack.Group screenOptions={{ presentation: "modal" }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
