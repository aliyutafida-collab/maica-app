import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

export function useScreenInsets() {
  const insets = useSafeAreaInsets();

  return {
    paddingTop: insets.top + Spacing.xl,
    paddingBottom: insets.bottom + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
  };
}
