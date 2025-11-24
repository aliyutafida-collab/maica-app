import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const { plan, daysLeftInTrial, isTrialActive, subscribeToPlan } = useSubscription();
  const navigation = useNavigation();

  const plans = [
    {
      id: 'standard',
      name: 'Standard',
      price: '₦2,500',
      period: '/month',
      features: [
        'Full inventory management',
        'Sales & expense tracking',
        'Comprehensive reports',
        'Multi-language support',
      ],
      icon: 'package',
      color: theme.primary,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₦5,000',
      period: '/month',
      features: [
        'Everything in Standard',
        'AI Business Advisor',
        'Tax optimization helper',
        'Advanced PDF exports',
        'Profit forecasting',
      ],
      icon: 'zap',
      color: theme.accent,
      isPopular: true,
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
          Subscription
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: paddingBottom + Spacing.xl },
        ]}
      >
        {isTrialActive && (
          <ThemedView
            style={[
              styles.trialBanner,
              { backgroundColor: theme.accent + '20', borderColor: theme.accent },
            ]}
          >
            <Feather name="clock" size={24} color={theme.accent} />
            <View style={styles.trialInfo}>
              <ThemedText style={[styles.trialText, { color: theme.text }]}>
                {daysLeftInTrial} days left in your free trial
              </ThemedText>
              <ThemedText
                style={[styles.trialSubtext, { color: theme.textSecondary }]}
              >
                Subscribe now to continue after trial ends
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {plan === 'trial' && !isTrialActive && (
          <ThemedView
            style={[
              styles.trialBanner,
              { backgroundColor: theme.error + '20', borderColor: theme.error },
            ]}
          >
            <Feather name="alert-circle" size={24} color={theme.error} />
            <View style={styles.trialInfo}>
              <ThemedText style={[styles.trialText, { color: theme.text }]}>
                Your trial has expired
              </ThemedText>
              <ThemedText
                style={[styles.trialSubtext, { color: theme.textSecondary }]}
              >
                Subscribe to continue using MaiCa
              </ThemedText>
            </View>
          </ThemedView>
        )}

        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Choose Your Plan
        </ThemedText>

        {plans.map((planItem) => (
          <Pressable
            key={planItem.id}
            onPress={() => subscribeToPlan(planItem.id as any)}
            style={({ pressed }) => [
              styles.planCard,
              {
                backgroundColor: theme.surface,
                borderColor: plan === planItem.id ? planItem.color : theme.border,
                borderWidth: plan === planItem.id ? 2 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {planItem.isPopular && (
              <View style={[styles.popularBadge, { backgroundColor: theme.accent }]}>
                <ThemedText style={styles.popularText}>Most Popular</ThemedText>
              </View>
            )}
            <View style={styles.planHeader}>
              <Feather name={planItem.icon as any} size={32} color={planItem.color} />
              <View style={styles.planInfo}>
                <ThemedText style={[styles.planName, { color: theme.text }]}>
                  {planItem.name}
                </ThemedText>
                <View style={styles.priceRow}>
                  <ThemedText style={[styles.planPrice, { color: theme.text }]}>
                    {planItem.price}
                  </ThemedText>
                  <ThemedText
                    style={[styles.planPeriod, { color: theme.textSecondary }]}
                  >
                    {planItem.period}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.features}>
              {planItem.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Feather name="check" size={16} color={theme.success} />
                  <ThemedText
                    style={[styles.featureText, { color: theme.textSecondary }]}
                  >
                    {feature}
                  </ThemedText>
                </View>
              ))}
            </View>
            {plan === planItem.id && (
              <View style={[styles.currentBadge, { backgroundColor: planItem.color }]}>
                <ThemedText style={styles.currentText}>Current Plan</ThemedText>
              </View>
            )}
          </Pressable>
        ))}

        <ThemedView
          style={[
            styles.testModeNotice,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Feather name="info" size={20} color={theme.accent} />
          <ThemedText style={[styles.testModeText, { color: theme.textSecondary }]}>
            Test mode - No actual payment required. Tap a plan to activate.
          </ThemedText>
        </ThemedView>
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
  trialBanner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  trialInfo: {
    flex: 1,
  },
  trialText: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  trialSubtext: {
    ...Typography.bodySm,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  popularText: {
    ...Typography.bodyXs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    ...Typography.h2,
  },
  planPeriod: {
    ...Typography.body,
    marginLeft: Spacing.xs,
  },
  features: {
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  featureText: {
    ...Typography.body,
  },
  currentBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  currentText: {
    ...Typography.bodySm,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  testModeNotice: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  testModeText: {
    ...Typography.bodySm,
    flex: 1,
  },
});
