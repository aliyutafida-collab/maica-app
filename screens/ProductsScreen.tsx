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
import { useTranslation, useRTL } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getProducts, deleteProduct } from "@/services/storage";
import { formatCurrency } from "@/lib/formatters";
import { debounce } from "@/services/httpClient";
import type { Product } from "@/lib/types";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const LOW_STOCK_THRESHOLD = 5;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const navigation = useNavigation<NavigationProp>();

  const rtlStyle = isRTL ? { flexDirection: "row-reverse" as const } : {};
  const rtlTextAlign = isRTL ? { textAlign: "right" as const } : {};

  async function loadProducts() {
    if (!user) return;
    try {
      const data = await getProducts(user.id);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  const debouncedLoad = useCallback(
    debounce(() => loadProducts(), 300),
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      debouncedLoad();
    }, [user])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  async function handleDelete(id: string) {
    Alert.alert(
      t("products.deleteTitle") || "Delete Product",
      t("products.deleteConfirm") || "Are you sure you want to delete this product?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: t("common.delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(id);
              await loadProducts();
            } catch (error: any) {
              Alert.alert(t("common.error") || "Error", error.message || "Failed to delete product");
            }
          },
        },
      ]
    );
  }

  function handleEditProduct(productId: string) {
    navigation.dispatch(
      CommonActions.navigate({
        name: "AddProduct",
        params: { productId },
      })
    );
  }

  function handleAddProduct() {
    navigation.dispatch(
      CommonActions.navigate({
        name: "AddProduct",
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
          rtlStyle,
          {
            backgroundColor: theme.surface,
            borderColor: isLowStock ? theme.warning : theme.border,
            borderWidth: isLowStock ? 2 : 1,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={[styles.productInfo, isRTL ? { alignItems: "flex-end" } : {}]}>
          <ThemedText style={[styles.productName, { color: theme.text }, rtlTextAlign]}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.category, { color: theme.textSecondary }, rtlTextAlign]}>
            {item.category}
          </ThemedText>
        </View>
        <View style={[styles.productMeta, isRTL ? { alignItems: "flex-start" } : {}]}>
          <ThemedText style={[styles.price, { color: theme.primary }]}>
            {formatCurrency(item.price)}
          </ThemedText>
          <View style={[styles.stockRow, rtlStyle]}>
            {isLowStock ? (
              <Feather
                name="alert-triangle"
                size={14}
                color={theme.warning}
                style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
              />
            ) : null}
            <ThemedText
              style={[styles.stock, { color: isLowStock ? theme.warning : theme.textSecondary }]}
            >
              {t("products.stock") || "Stock"}: {stockCount}
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
              {loading
                ? t("common.loading") || "Loading..."
                : t("products.noProducts") || "No products yet"}
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
            right: isRTL ? undefined : Spacing.lg,
            left: isRTL ? Spacing.lg : undefined,
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
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  productMeta: {
    alignItems: "flex-end",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  stock: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    marginTop: Spacing.lg,
  },
  fab: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
