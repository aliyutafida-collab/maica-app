import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProductsScreen from "@/screens/ProductsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

export type ProductsStackParamList = {
  ProductsList: undefined;
};

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export default function ProductsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}
    >
      <Stack.Screen
        name="ProductsList"
        component={ProductsScreen}
        options={{
          title: "Products",
        }}
      />
    </Stack.Navigator>
  );
}
