import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "h1":
        return { fontSize: Typography.h1.fontSize, fontWeight: "700" as const, lineHeight: Typography.h1.lineHeight };
      case "h2":
        return { fontSize: Typography.h2.fontSize, fontWeight: "700" as const, lineHeight: Typography.h2.lineHeight };
      case "h3":
        return { fontSize: Typography.h3.fontSize, fontWeight: "700" as const, lineHeight: Typography.h3.lineHeight };
      case "h4":
        return { fontSize: Typography.h4.fontSize, fontWeight: "600" as const, lineHeight: Typography.h4.lineHeight };
      case "body":
        return { fontSize: Typography.body.fontSize, fontWeight: "400" as const, lineHeight: Typography.body.lineHeight };
      case "small":
        return { fontSize: Typography.small.fontSize, fontWeight: "400" as const, lineHeight: Typography.small.lineHeight };
      case "link":
        return { fontSize: Typography.link.fontSize, fontWeight: "600" as const, lineHeight: Typography.link.lineHeight };
      default:
        return { fontSize: Typography.body.fontSize, fontWeight: "400" as const, lineHeight: Typography.body.lineHeight };
    }
  };

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest} />
  );
}
