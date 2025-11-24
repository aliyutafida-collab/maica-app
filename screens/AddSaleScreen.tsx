import { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { addSale, getProducts } from "@/services/storage";
import { DEFAULT_TAX_RATE, calcSubtotal, calcTax, calcTotal } from "@/lib/tax";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/lib/types";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddSaleScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE.toString());
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    async function loadProducts() {
      if (!user) return;
      const data = await getProducts(user.id);
      setProducts(data);
      if (data.length > 0) {
        setSelectedProductId(data[0].id);
        setUnitPrice(data[0].price.toString());
      }
    }
    loadProducts();
  }, [user]);

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        setUnitPrice(product.price.toString());
      }
    }
  }, [selectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const subtotal = calcSubtotal(Number(quantity) || 0, Number(unitPrice) || 0);
  const taxAmount = calcTax(subtotal, Number(taxRate) || 0, false);
  const total = calcTotal(
    subtotal,
    Number(taxRate) || 0,
    Number(discount) || 0
  );

  async function handleSave() {
    const newErrors: any = {};

    if (!selectedProductId) newErrors.product = "Product is required";
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0)
      newErrors.quantity = "Valid quantity is required";
    if (!unitPrice || isNaN(Number(unitPrice)))
      newErrors.unitPrice = "Valid price is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (!user) return;
      await addSale({
        productId: selectedProductId,
        productName: selectedProduct?.name || "",
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate),
        discount: Number(discount),
        taxAmount,
        total,
        userId: user.id,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>
          Record Sale
        </ThemedText>
      </View>

      {products.length === 0 ? (
        <ThemedText style={[styles.warning, { color: theme.error }]}>
          No products available. Please add a product first.
        </ThemedText>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Product
            </ThemedText>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Picker
                selectedValue={selectedProductId}
                onValueChange={setSelectedProductId}
                style={{ color: theme.text }}
              >
                {products.map((product) => (
                  <Picker.Item
                    key={product.id}
                    label={product.name}
                    value={product.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            keyboardType="numeric"
            error={errors.quantity}
          />

          <TextInput
            label="Unit Price"
            value={unitPrice}
            onChangeText={setUnitPrice}
            placeholder="0.00"
            keyboardType="numeric"
            error={errors.unitPrice}
          />

          <TextInput
            label="Tax Rate (%)"
            value={taxRate}
            onChangeText={setTaxRate}
            placeholder="7.5"
            keyboardType="numeric"
          />

          <TextInput
            label="Discount"
            value={discount}
            onChangeText={setDiscount}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <View
            style={[
              styles.totalCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
                Subtotal
              </ThemedText>
              <ThemedText style={[styles.totalValue, { color: theme.text }]}>
                {formatCurrency(subtotal)}
              </ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
                Tax
              </ThemedText>
              <ThemedText style={[styles.totalValue, { color: theme.text }]}>
                {formatCurrency(taxAmount)}
              </ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
                Discount
              </ThemedText>
              <ThemedText style={[styles.totalValue, { color: theme.text }]}>
                -₦{Number(discount).toFixed(2)}
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.totalRow}>
              <ThemedText style={[styles.finalLabel, { color: theme.text }]}>
                Total
              </ThemedText>
              <ThemedText style={[styles.finalValue, { color: theme.primary }]}>
                {formatCurrency(total)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.buttons}>
            <PrimaryButton
              title="Record Sale"
              onPress={handleSave}
              loading={loading}
            />
            <SecondaryButton
              title="Cancel"
              onPress={() => navigation.goBack()}
            />
          </View>
        </>
      )}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
  },
  warning: {
    ...Typography.body,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  totalCard: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    ...Typography.body,
  },
  totalValue: {
    ...Typography.body,
  },
  finalLabel: {
    ...Typography.body,
    fontWeight: "600",
  },
  finalValue: {
    ...Typography.h3,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  buttons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
