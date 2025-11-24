import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReportsScreen from "@/screens/ReportsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

export type ReportsStackParamList = {
  ReportsHome: undefined;
};

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export default function ReportsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      <Stack.Screen
        name="ReportsHome"
        component={ReportsScreen}
        options={{
          title: "Reports",
        }}
      />
    </Stack.Navigator>
  );
}
