import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { useTranslation } from '@/contexts/LanguageContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: string;
}

export default function FinancialLearningScreen() {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const navigation = useNavigation<NavigationProp>();

  const lessons: Lesson[] = [
    {
      id: '1',
      title: 'What is Cost Price',
      description: 'Understanding the amount you pay for products',
      icon: 'dollar-sign',
      content: 'Cost Price is the amount you pay to acquire a product for resale. It includes the purchase price from suppliers, plus any import duties, shipping costs, or other charges directly related to obtaining the product. Knowing your cost price is essential for calculating profit margins.',
    },
    {
      id: '2',
      title: 'What is Selling Price',
      description: 'The price at which you sell to customers',
      icon: 'shopping-cart',
      content: 'Selling Price (or Retail Price) is the amount customers pay when they buy your products. It should be higher than your cost price to generate profit. Your selling price is typically determined by market demand, competition, and the profit margin you want to achieve.',
    },
    {
      id: '3',
      title: 'Understanding Profit',
      description: 'How to calculate and maximize profits',
      icon: 'trending-up',
      content: 'Profit = Selling Price - Cost Price. Profit Margin = (Profit / Selling Price) × 100%. Understanding your profit helps you make pricing decisions, identify which products are most profitable, and plan your business growth strategy effectively.',
    },
    {
      id: '4',
      title: 'How Inventory Works',
      description: 'Managing your stock efficiently',
      icon: 'package',
      content: 'Inventory management is tracking what products you have in stock. Keep inventory levels balanced - not too high (which ties up cash) and not too low (which loses sales). Regularly monitor stock levels, set reorder points, and track product movement to optimize your inventory.',
    },
    {
      id: '5',
      title: 'Pricing Strategy',
      description: 'Setting competitive and profitable prices',
      icon: 'bar-chart-2',
      content: 'Effective pricing strategies include: Cost-Plus Pricing (cost + fixed margin), Competitive Pricing (matching market rates), Value-Based Pricing (based on perceived customer value), and Dynamic Pricing (adjusting based on demand). Choose a strategy that aligns with your business goals.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.backgroundRoot, paddingTop },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          Financial Learning
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: paddingBottom + Spacing.xl }]}>
        {lessons.map((lesson) => (
          <ThemedView
            key={lesson.id}
            style={[
              styles.lessonCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.lessonHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.accent + '20' },
                ]}
              >
                <Feather name={lesson.icon as any} size={28} color={theme.accent} />
              </View>
              <View style={styles.lessonTitleContainer}>
                <ThemedText style={[styles.lessonTitle, { color: theme.text }]}>
                  {lesson.title}
                </ThemedText>
                <ThemedText
                  style={[styles.lessonDescription, { color: theme.textSecondary }]}
                >
                  {lesson.description}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.lessonContent, { color: theme.text }]}>
              {lesson.content}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h3,
  },
  content: {
    padding: Spacing.lg,
  },
  lessonCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  lessonHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  lessonTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  lessonDescription: {
    ...Typography.bodySm,
  },
  lessonContent: {
    ...Typography.body,
    lineHeight: 24,
  },
});
