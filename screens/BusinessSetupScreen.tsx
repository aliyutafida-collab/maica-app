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
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { addProduct } from '@/services/storage';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BusinessSetupScreen() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productDescription, setProductDescription] = useState('');

  const { user, completeSetup } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  async function handleNext() {
    if (step === 1) {
      if (!businessName.trim()) {
        Alert.alert('Error', 'Please enter your business name');
        return;
      }
      await AsyncStorage.setItem(`@maica_business_name_${user?.id}`, businessName);
      setStep(2);
    } else if (step === 2) {
      if (!category.trim()) {
        Alert.alert('Error', 'Please select a business category');
        return;
      }
      await AsyncStorage.setItem(`@maica_business_category_${user?.id}`, category);
      setStep(3);
    }
  }

  async function handleComplete() {
    if (!productName.trim() || !productPrice || !productCost || !productStock) {
      Alert.alert('Error', 'Please fill in all product fields');
      return;
    }

    if (!user) return;

    try {
      await addProduct(user.id, {
        name: productName,
        category: category || 'General',
        price: parseFloat(productPrice),
        cost: parseFloat(productCost),
        stock: parseInt(productStock),
        description: productDescription,
      });

      await AsyncStorage.setItem(`@maica_setup_complete_${user.id}`, 'true');
      completeSetup();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as any }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save product. Please try again.');
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
        <ThemedText style={[styles.title, { color: theme.primary }]}>
          Start Your Business Setup
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Step {step} of 3
        </ThemedText>
      </View>

      {step === 1 && (
        <View style={styles.stepContainer}>
          <Feather name="briefcase" size={64} color={theme.accent} style={styles.icon} />
          <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
            What's your business name?
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Enter business name"
            placeholderTextColor={theme.textSecondary}
            value={businessName}
            onChangeText={setBusinessName}
            autoFocus
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Feather name="tag" size={64} color={theme.accent} style={styles.icon} />
          <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
            Select your business category
          </ThemedText>
          <View style={styles.categoriesGrid}>
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
      )}

      {step === 3 && (
        <View style={styles.stepContainer}>
          <Feather name="package" size={64} color={theme.accent} style={styles.icon} />
          <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
            Add your first product
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Product name"
            placeholderTextColor={theme.textSecondary}
            value={productName}
            onChangeText={setProductName}
          />
          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.halfInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Selling price (₦)"
              placeholderTextColor={theme.textSecondary}
              value={productPrice}
              onChangeText={setProductPrice}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[
                styles.input,
                styles.halfInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Cost price (₦)"
              placeholderTextColor={theme.textSecondary}
              value={productCost}
              onChangeText={setProductCost}
              keyboardType="decimal-pad"
            />
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Stock quantity"
            placeholderTextColor={theme.textSecondary}
            value={productStock}
            onChangeText={setProductStock}
            keyboardType="number-pad"
          />
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Description (optional)"
            placeholderTextColor={theme.textSecondary}
            value={productDescription}
            onChangeText={setProductDescription}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        {step < 3 ? (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText style={styles.buttonText}>Next</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText style={styles.buttonText}>Complete Setup</ThemedText>
          </Pressable>
        )}
        {step > 1 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <ThemedText style={[styles.backButtonText, { color: theme.textSecondary }]}>
              Back
            </ThemedText>
          </Pressable>
        )}
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
    ...Typography.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
  },
  stepContainer: {
    marginBottom: Spacing['2xl'],
  },
  icon: {
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  input: {
    ...Typography.body,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    ...Typography.body,
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
    ...Typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    ...Typography.body,
  },
});
