import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";

import { Spacing } from "@/constants/theme";

const TAB_BAR_HEIGHT = 49;

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute();
  
  const isTabScreen = [
    "DashboardHome",
    "ProductsList",
    "ReportsHome",
    "MoreHome",
  ].includes(route.name);
  
  const tabBarHeight = isTabScreen ? TAB_BAR_HEIGHT : 0;

  return {
    paddingTop: headerHeight + Spacing.xl,
    paddingBottom: tabBarHeight + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
  };
}
