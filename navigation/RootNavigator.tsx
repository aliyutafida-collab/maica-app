import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "./MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import BusinessSetupScreen from "@/screens/BusinessSetupScreen";
import AddProductScreen from "@/screens/AddProductScreen";
import AddSaleScreen from "@/screens/AddSaleScreen";
import AddExpenseScreen from "@/screens/AddExpenseScreen";
import AIAdvisorScreen from "@/screens/AIAdvisorScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import FinancialLearningScreen from "@/screens/FinancialLearningScreen";
import TaxCalculatorScreen from "@/screens/TaxCalculatorScreen";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  BusinessSetup: undefined;
  AddProduct: { productId?: string } | undefined;
  AddSale: undefined;
  AddExpense: undefined;
  AIAdvisor: undefined;
  Subscription: undefined;
  FinancialLearning: undefined;
  TaxCalculator: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading, setupComplete } = useAuth();

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
          {!setupComplete ? (
            <Stack.Screen name="BusinessSetup" component={BusinessSetupScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Group screenOptions={{ presentation: "modal" }}>
                <Stack.Screen name="AddProduct" component={AddProductScreen} />
                <Stack.Screen name="AddSale" component={AddSaleScreen} />
                <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
                <Stack.Screen name="AIAdvisor" component={AIAdvisorScreen} />
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                <Stack.Screen name="FinancialLearning" component={FinancialLearningScreen} />
                <Stack.Screen name="TaxCalculator" component={TaxCalculatorScreen} />
              </Stack.Group>
            </>
          )}
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
