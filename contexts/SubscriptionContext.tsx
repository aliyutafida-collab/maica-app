import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export type SubscriptionPlan = 'trial' | 'standard' | 'premium';

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  daysLeftInTrial: number;
  isTrialActive: boolean;
  hasFeature: (feature: string) => boolean;
  subscribeToPlan: (plan: SubscriptionPlan) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_DAYS = 60;
const SUBSCRIPTION_KEY = '@maica_subscription';

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>('trial');
  const [trialStartDate, setTrialStartDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  async function loadSubscription() {
    if (!user) return;

    try {
      const data = await AsyncStorage.getItem(`${SUBSCRIPTION_KEY}_${user.id}`);
      if (data) {
        const { plan: savedPlan, trialStartDate: savedStartDate } = JSON.parse(data);
        setPlan(savedPlan);
        setTrialStartDate(savedStartDate);
      } else {
        const startDate = new Date().toISOString();
        setTrialStartDate(startDate);
        await AsyncStorage.setItem(
          `${SUBSCRIPTION_KEY}_${user.id}`,
          JSON.stringify({ plan: 'trial', trialStartDate: startDate })
        );
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  }

  async function subscribeToPlan(newPlan: SubscriptionPlan) {
    if (!user) return;

    setPlan(newPlan);
    await AsyncStorage.setItem(
      `${SUBSCRIPTION_KEY}_${user.id}`,
      JSON.stringify({ plan: newPlan, trialStartDate })
    );
  }

  const daysLeftInTrial = (() => {
    if (!trialStartDate || plan !== 'trial') return 0;
    
    const start = new Date(trialStartDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, TRIAL_DAYS - daysPassed);
    return daysLeft;
  })();

  const isTrialActive = plan === 'trial' && daysLeftInTrial > 0;

  function hasFeature(feature: string): boolean {
    const featureMap: Record<string, SubscriptionPlan[]> = {
      inventory: ['trial', 'standard', 'premium'],
      sales: ['trial', 'standard', 'premium'],
      expenses: ['trial', 'standard', 'premium'],
      reports: ['trial', 'standard', 'premium'],
      multiLanguage: ['trial', 'standard', 'premium'],
      aiAdvisor: ['premium'],
      taxOptimization: ['premium'],
      advancedPdfExports: ['premium'],
      profitForecasting: ['premium'],
    };

    const allowedPlans = featureMap[feature] || [];
    
    if (plan === 'trial' && !isTrialActive) {
      return false;
    }

    return allowedPlans.includes(plan);
  }

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        daysLeftInTrial,
        isTrialActive,
        hasFeature,
        subscribeToPlan,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
