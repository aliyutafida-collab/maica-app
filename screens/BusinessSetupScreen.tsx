import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, useRTL } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { addProduct, addProducts } from '@/services/storage';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProductEntry {
  name: string;
  price: string;
  cost: string;
  stock: string;
  description: string;
}

export default function BusinessSetupScreen() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState<ProductEntry[]>([
    { name: '', price: '', cost: '', stock: '', description: '' }
  ]);

  const { user, completeSetup } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const rtlStyle = isRTL ? { flexDirection: 'row-reverse' as const } : {};
  const rtlTextAlign = isRTL ? { textAlign: 'right' as const } : { textAlign: 'left' as const };

  async function handleNext() {
    if (step === 1) {
      if (!businessName.trim()) {
        Alert.alert(t('common.error') || 'Error', t('setup.businessNameRequired') || 'Please enter your business name');
        return;
      }
      await AsyncStorage.setItem(`@maica_business_name_${user?.id}`, businessName);
      await AsyncStorage.setItem(`@maica_company_name`, businessName);
      setStep(2);
    } else if (step === 2) {
      if (!category.trim()) {
        Alert.alert(t('common.error') || 'Error', t('setup.categoryRequired') || 'Please select a business category');
        return;
      }
      await AsyncStorage.setItem(`@maica_business_category_${user?.id}`, category);
      setStep(3);
    }
  }

  function updateProduct(index: number, field: keyof ProductEntry, value: string) {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  }

  function addMoreProduct() {
    if (products.length >= 5) {
      Alert.alert(t('setup.maxProducts') || 'Maximum Products', t('setup.maxProductsReached') || 'You can add up to 5 products during setup');
      return;
    }
    setProducts([...products, { name: '', price: '', cost: '', stock: '', description: '' }]);
  }

  function removeProduct(index: number) {
    if (products.length <= 1) return;
    setProducts(products.filter((_, i) => i !== index));
  }

  async function handleComplete() {
    const validProducts = products.filter(p => p.name.trim() && p.price);
    
    if (validProducts.length === 0) {
      Alert.alert(t('common.error') || 'Error', t('setup.addAtLeastOneProduct') || 'Please add at least one product with name and price');
      return;
    }

    if (!user) return;

    try {
      const productData = validProducts.map(p => ({
        name: p.name.trim(),
        category: category || 'General',
        price: parseFloat(p.price) || 0,
        cost: parseFloat(p.cost) || 0,
        stock: parseInt(p.stock) || 0,
        description: p.description.trim(),
      }));

      if (productData.length === 1) {
        await addProduct(user.id, productData[0]);
      } else {
        await addProducts(user.id, productData);
      }

      await AsyncStorage.setItem(`@maica_setup_complete_${user.id}`, 'true');
      completeSetup();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as any }],
      });
    } catch (error: any) {
      Alert.alert(t('common.error') || 'Error', error.message || 'Failed to save products. Please try again.');
    }
  }

  const categories = [
    'Retail',
    'Food & Beverage',
    'Services',
    'Fashion & Clothing',
    'Electronics',
    'Health & Beauty',
    'Other',
  ];

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.primary }, rtlTextAlign]}>
          {t('setup.title') || 'Start Your Business Setup'}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('setup.step') || 'Step'} {step} {t('setup.of') || 'of'} 3
        </ThemedText>
      </View>

      {step === 1 ? (
        <View style={styles.stepContainer}>
          <Feather name="briefcase" size={64} color={theme.accent} style={styles.icon} />
          <ThemedText style={[styles.stepTitle, { color: theme.text }, rtlTextAlign]}>
            {t('setup.businessNameQuestion') || "What's your business name?"}
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
              rtlTextAlign,
            ]}
            placeholder={t('setup.enterBusinessName') || "Enter business name"}
            placeholderTextColor={theme.textSecondary}
            value={businessName}
            onChangeText={setBusinessName}
            autoFocus
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.stepContainer}>
          <Feather name="tag" size={64} color={theme.accent} style={styles.icon} />
          <ThemedText style={[styles.stepTitle, { color: theme.text }, rtlTextAlign]}>
            {t('setup.categoryQuestion') || 'Select your business category'}
          </ThemedText>
          <View style={[styles.categoriesGrid, rtlStyle]}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryButton,
                  {
                    backgroundColor: category === cat ? theme.accent : theme.surface,
                    borderColor: category === cat ? theme.accent : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.categoryText,
                    { color: category === cat ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {cat}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.stepContainer}>
          <Feather name="package" size={64} color={theme.accent} style={styles.icon} />
          <ThemedText style={[styles.stepTitle, { color: theme.text }, rtlTextAlign]}>
            {t('setup.addProducts') || 'Add your products'}
          </ThemedText>
          
          {products.map((product, index) => (
            <ThemedView
              key={index}
              style={[styles.productCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.productHeader, rtlStyle]}>
                <ThemedText style={[styles.productLabel, { color: theme.textSecondary }]}>
                  {t('setup.product') || 'Product'} {index + 1}
                </ThemedText>
                {products.length > 1 ? (
                  <Pressable onPress={() => removeProduct(index)}>
                    <Feather name="x-circle" size={20} color={theme.error} />
                  </Pressable>
                ) : null}
              </View>
              
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  rtlTextAlign,
                ]}
                placeholder={t('setup.productName') || "Product name"}
                placeholderTextColor={theme.textSecondary}
                value={product.name}
                onChangeText={(v) => updateProduct(index, 'name', v)}
              />
              <View style={[styles.row, rtlStyle]}>
                <TextInput
                  style={[
                    styles.input,
                    styles.halfInput,
                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                    rtlTextAlign,
                  ]}
                  placeholder={t('setup.sellingPrice') || "Selling price (₦)"}
                  placeholderTextColor={theme.textSecondary}
                  value={product.price}
                  onChangeText={(v) => updateProduct(index, 'price', v)}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.halfInput,
                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                    rtlTextAlign,
                  ]}
                  placeholder={t('setup.costPrice') || "Cost price (₦)"}
                  placeholderTextColor={theme.textSecondary}
                  value={product.cost}
                  onChangeText={(v) => updateProduct(index, 'cost', v)}
                  keyboardType="decimal-pad"
                />
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  rtlTextAlign,
                ]}
                placeholder={t('setup.stockQuantity') || "Stock quantity"}
                placeholderTextColor={theme.textSecondary}
                value={product.stock}
                onChangeText={(v) => updateProduct(index, 'stock', v)}
                keyboardType="number-pad"
              />
            </ThemedView>
          ))}

          {products.length < 5 ? (
            <Pressable
              onPress={addMoreProduct}
              style={({ pressed }) => [
                styles.addMoreButton,
                { borderColor: theme.accent, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="plus" size={20} color={theme.accent} />
              <ThemedText style={[styles.addMoreText, { color: theme.accent }]}>
                {t('setup.addAnotherProduct') || 'Add another product'}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.buttonContainer}>
        {step < 3 ? (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText style={styles.buttonText}>{t('common.next') || 'Next'}</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText style={styles.buttonText}>{t('setup.complete') || 'Complete Setup'}</ThemedText>
          </Pressable>
        )}
        {step > 1 ? (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <ThemedText style={[styles.backButtonText, { color: theme.textSecondary }]}>
              {t('common.back') || 'Back'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  stepContainer: {
    marginBottom: Spacing['2xl'],
  },
  icon: {
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  productCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  addMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: Spacing['2xl'],
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
});
