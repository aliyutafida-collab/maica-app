import React from "react";
import { View, StyleSheet } from "react-native";

export default function Skeleton({
  width = "100%",
  height = 16,
  style = {},
}: any) {
  return <View style={[styles.container, { width, height }, style]} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e6eef9",
    borderRadius: 8,
    opacity: 0.9,
  },
});
