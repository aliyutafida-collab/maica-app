import { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  FlatList,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/theme";
import { getProducts, deleteProduct } from "@/services/storage";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/lib/types";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const LOW_STOCK_THRESHOLD = 5;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const navigation = useNavigation<NavigationProp>();

  async function loadProducts() {
    if (!user) return;
    const data = await getProducts(user.id);
    setProducts(data);
  }

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [user])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteProduct(id);
          await loadProducts();
        },
      },
    ]);
  }

  function handleEditProduct(productId: string) {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'AddProduct',
        params: { productId },
      })
    );
  }

  function handleAddProduct() {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'AddProduct',
      })
    );
  }

  function renderProduct({ item }: { item: Product }) {
    const isLowStock = (item.stock ?? 0) <= LOW_STOCK_THRESHOLD;
    const stockCount = item.stock ?? 0;
    
    return (
      <Pressable
        onPress={() => handleEditProduct(item.id)}
        onLongPress={() => handleDelete(item.id)}
        style={({ pressed }) => [
          styles.productCard,
          {
            backgroundColor: theme.surface,
            borderColor: isLowStock ? theme.warning : theme.border,
            borderWidth: isLowStock ? 2 : 1,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.productInfo}>
          <ThemedText style={[styles.productName, { color: theme.text }]}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.category, { color: theme.textSecondary }]}>
            {item.category}
          </ThemedText>
        </View>
        <View style={styles.productMeta}>
          <ThemedText style={[styles.price, { color: theme.primary }]}>
            {formatCurrency(item.price)}
          </ThemedText>
          <View style={styles.stockRow}>
            {isLowStock ? (
              <Feather name="alert-triangle" size={14} color={theme.warning} style={{ marginRight: 4 }} />
            ) : null}
            <ThemedText style={[styles.stock, { color: isLowStock ? theme.warning : theme.textSecondary }]}>
              Stock: {stockCount}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop, paddingBottom: paddingBottom + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={64} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No products yet
            </ThemedText>
          </View>
        }
      />
      <Pressable
        onPress={handleAddProduct}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.accent,
            opacity: pressed ? 0.8 : 1,
            bottom: paddingBottom + Spacing.lg,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
          },
        ]}
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.xl,
  },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.body,
    fontWeight: "600" as const,
    marginBottom: Spacing.xs,
  },
  category: {
    ...Typography.bodyXs,
  },
  productMeta: {
    alignItems: "flex-end",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    ...Typography.body,
    fontWeight: "600" as const,
    marginBottom: Spacing.xs,
  },
  stock: {
    ...Typography.caption,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.lg,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
