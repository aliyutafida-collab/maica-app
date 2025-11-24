import { useState } from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "How can I increase my sales?",
  "What are the tax implications of my revenue?",
  "Give me insights on my expenses",
  "How do I improve my profit margins?",
];

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const { theme } = useTheme();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const navigation = useNavigation<NavigationProp>();

  function handleSuggestedPrompt(prompt: string) {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "AI Advisor is currently under development. This feature will provide personalized business insights and recommendations based on your sales, expenses, and tax data. Stay tuned for updates!",
    };

    setMessages([...messages, userMessage, aiResponse]);
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          {
            backgroundColor: isUser ? theme.accent : theme.backgroundDefault,
            alignSelf: isUser ? "flex-end" : "flex-start",
          },
        ]}
      >
        <ThemedText
          style={[
            styles.messageText,
            { color: isUser ? "#FFFFFF" : theme.text },
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
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          AI Business Advisor
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: paddingBottom + 100 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="zap" size={64} color={theme.accent} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              AI Business Advisor
            </ThemedText>
            <ThemedText
              style={[styles.emptySubtitle, { color: theme.textSecondary }]}
            >
              Get personalized insights and recommendations for your business
            </ThemedText>
            <View style={styles.suggestedContainer}>
              <ThemedText
                style={[styles.suggestedTitle, { color: theme.textSecondary }]}
              >
                Suggested Questions
              </ThemedText>
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSuggestedPrompt(prompt)}
                  style={({ pressed }) => [
                    styles.suggestedChip,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.suggestedText, { color: theme.accent }]}
                  >
                    {prompt}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />

      {messages.length > 0 && (
        <View style={styles.suggestedChipsRow}>
          {SUGGESTED_PROMPTS.slice(0, 2).map((prompt, index) => (
            <Pressable
              key={index}
              onPress={() => handleSuggestedPrompt(prompt)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.chipText, { color: theme.accent }]}>
                {prompt}
              </ThemedText>
            </Pressable>
          ))}
        </View>
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
    ...Typography.body,
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
  userBubble: {},
  aiBubble: {},
  messageText: {
    ...Typography.body,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyTitle: {
    ...Typography.h2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  suggestedContainer: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  suggestedTitle: {
    ...Typography.small,
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
    ...Typography.body,
  },
  suggestedChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  chip: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipText: {
    ...Typography.small,
  },
});
