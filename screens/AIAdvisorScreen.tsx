import { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, TextInput as RNTextInput, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation, useRTL, useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { api } from "@/services/httpClient";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface QuickInsight {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
}

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { language } = useLanguage();
  const { hasFeature } = useSubscription();

  const isPremium = hasFeature("aiAdvisor");
  const rtlTextAlign = isRTL ? { textAlign: "right" as const } : {};
  const rtlStyle = isRTL ? { flexDirection: "row-reverse" as const } : {};

  const SUGGESTED_PROMPTS = [
    t("advisor.howToIncreaseSales") || "How can I increase my sales?",
    t("advisor.reduceCosts") || "How can I reduce my costs?",
    t("advisor.improveCashflow") || "How do I improve my cashflow?",
    t("advisor.pricingStrategy") || "What pricing strategy should I use?",
  ];

  useEffect(() => {
    if (isPremium) {
      loadQuickInsights();
    } else {
      setLoadingInsights(false);
    }
  }, [isPremium]);

  async function loadQuickInsights() {
    try {
      const response = await api.get<{ insights: QuickInsight[] }>("/advisor/quick-insights");
      if (response.ok && response.data?.insights) {
        setQuickInsights(response.data.insights);
      }
    } catch (error) {
      console.error("Failed to load quick insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  }

  async function handleSendMessage(text: string) {
    if (!text.trim() || loading) return;

    if (!isPremium) {
      Alert.alert(
        t("subscription.premiumRequired") || "Premium Required",
        t("advisor.premiumMessage") || "AI Advisor is available for Premium subscribers. Upgrade to get personalized business insights."
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await api.post<{ response: string; disclaimer: string; fallback?: boolean }>(
        "/advisor/ai-insights",
        { question: text.trim(), language }
      );

      if (response.ok && response.data?.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.response,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else if (response.data?.fallback) {
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t("advisor.serviceUnavailable") || "AI Advisor is temporarily unavailable. Please try again later.",
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("advisor.errorMessage") || "Sorry, I couldn't process your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function getInsightIcon(type: string) {
    switch (type) {
      case "success": return "trending-up";
      case "warning": return "alert-triangle";
      default: return "info";
    }
  }

  function getInsightColor(type: string) {
    switch (type) {
      case "success": return Colors.success;
      case "warning": return Colors.warning;
      default: return Colors.accent;
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? theme.accent : theme.surface,
            alignSelf: isUser ? (isRTL ? "flex-start" : "flex-end") : (isRTL ? "flex-end" : "flex-start"),
          },
        ]}
      >
        <ThemedText
          style={[
            styles.messageText,
            { color: isUser ? "#FFFFFF" : theme.text },
            rtlTextAlign,
          ]}
        >
          {item.content}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.backgroundRoot, paddingTop },
          rtlStyle,
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          {t("advisor.title") || "AI Business Advisor"}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {!isPremium ? (
        <View style={styles.premiumGate}>
          <Feather name="lock" size={64} color={theme.textSecondary} />
          <ThemedText style={[styles.premiumTitle, { color: theme.text }, rtlTextAlign]}>
            {t("subscription.premiumFeature") || "Premium Feature"}
          </ThemedText>
          <ThemedText style={[styles.premiumSubtitle, { color: theme.textSecondary }, rtlTextAlign]}>
            {t("advisor.premiumDescription") || "Get personalized AI-powered business insights, recommendations, and strategies tailored for Nigerian SMEs."}
          </ThemedText>
          <Pressable
            onPress={() => navigation.navigate("Subscription" as any)}
            style={[styles.upgradeButton, { backgroundColor: theme.accent }]}
          >
            <ThemedText style={styles.upgradeButtonText}>
              {t("subscription.upgrade") || "Upgrade to Premium"}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: paddingBottom + 140 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="zap" size={64} color={theme.accent} />
                <ThemedText style={[styles.emptyTitle, { color: theme.text }, rtlTextAlign]}>
                  {t("advisor.title") || "AI Business Advisor"}
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }, rtlTextAlign]}>
                  {t("advisor.subtitle") || "Get personalized insights and recommendations for your business"}
                </ThemedText>

                {loadingInsights ? (
                  <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: Spacing.xl }} />
                ) : quickInsights.length > 0 ? (
                  <View style={styles.insightsContainer}>
                    <ThemedText style={[styles.insightsTitle, { color: theme.textSecondary }, rtlTextAlign]}>
                      {t("advisor.quickInsights") || "Quick Insights"}
                    </ThemedText>
                    {quickInsights.map((insight, index) => (
                      <View
                        key={index}
                        style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        <Feather name={getInsightIcon(insight.type) as any} size={20} color={getInsightColor(insight.type)} />
                        <View style={styles.insightContent}>
                          <ThemedText style={[styles.insightTitle, { color: theme.text }, rtlTextAlign]}>
                            {insight.title}
                          </ThemedText>
                          <ThemedText style={[styles.insightMessage, { color: theme.textSecondary }, rtlTextAlign]}>
                            {insight.message}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.suggestedContainer}>
                  <ThemedText style={[styles.suggestedTitle, { color: theme.textSecondary }, rtlTextAlign]}>
                    {t("advisor.suggestedQuestions") || "Suggested Questions"}
                  </ThemedText>
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSendMessage(prompt)}
                      style={({ pressed }) => [
                        styles.suggestedChip,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.suggestedText, { color: theme.accent }, rtlTextAlign]}>
                        {prompt}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          />

          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundRoot, paddingBottom: paddingBottom + Spacing.md }]}>
            <ThemedText style={[styles.disclaimer, { color: theme.textSecondary }, rtlTextAlign]}>
              {t("advisor.disclaimer") || "AI advice is for informational purposes only. Consult professionals for official guidance."}
            </ThemedText>
            <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }, rtlStyle]}>
              <RNTextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={t("advisor.askQuestion") || "Ask a business question..."}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }, rtlTextAlign]}
                multiline
                maxLength={500}
                editable={!loading}
              />
              <Pressable
                onPress={() => handleSendMessage(inputText)}
                disabled={loading || !inputText.trim()}
                style={({ pressed }) => [
                  styles.sendButton,
                  { backgroundColor: theme.accent, opacity: pressed || loading || !inputText.trim() ? 0.5 : 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="send" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  premiumGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  premiumSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  upgradeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  messagesList: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  insightsContainer: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestedContainer: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  suggestedChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  suggestedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  disclaimer: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
