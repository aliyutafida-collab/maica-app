import { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { TextInput } from "@/components/TextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";
import { addProduct, updateProduct, getProducts } from "@/services/storage";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type RouteProps = NativeStackScreenProps<RootStackParamList, "AddProduct">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddProductScreen() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps["route"]>();
  const productId = route.params?.productId;

  useEffect(() => {
    async function loadProduct() {
      if (productId && user) {
        const products = await getProducts(user.id);
        const product = products.find((p) => p.id === productId);
        if (product) {
          setName(product.name);
          setCategory(product.category);
          setPrice(product.price.toString());
          setStock(product.stock.toString());
          setDescription(product.description || "");
        }
      }
    }
    loadProduct();
  }, [productId, user]);

  async function handleSave() {
    const newErrors: any = {};

    if (!name) newErrors.name = "Name is required";
    if (!category) newErrors.category = "Category is required";
    if (!price || isNaN(Number(price)))
      newErrors.price = "Valid price is required";
    if (!stock || isNaN(Number(stock)))
      newErrors.stock = "Valid stock is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (productId) {
        await updateProduct(productId, {
          name,
          category,
          price: Number(price),
          stock: Number(stock),
          description,
        });
      } else {
        if (!user) return;
        await addProduct({
          name,
          category,
          price: Number(price),
          stock: Number(stock),
          description,
          userId: user.id,
        });
      }
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
          {productId ? "Edit Product" : "Add Product"}
        </ThemedText>
      </View>

      <TextInput
        label="Product Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter product name"
        error={errors.name}
      />

      <TextInput
        label="Category"
        value={category}
        onChangeText={setCategory}
        placeholder="e.g., Electronics, Food"
        error={errors.category}
      />

      <TextInput
        label="Price"
        value={price}
        onChangeText={setPrice}
        placeholder="0.00"
        keyboardType="numeric"
        error={errors.price}
      />

      <TextInput
        label="Stock Quantity"
        value={stock}
        onChangeText={setStock}
        placeholder="0"
        keyboardType="numeric"
        error={errors.stock}
      />

      <TextInput
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Enter product description"
        multiline
        numberOfLines={4}
      />

      <View style={styles.buttons}>
        <PrimaryButton
          title={productId ? "Update Product" : "Save Product"}
          onPress={handleSave}
          loading={loading}
        />
        <SecondaryButton title="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32, fontWeight: '700' as const, lineHeight: 40,
  },
  buttons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
