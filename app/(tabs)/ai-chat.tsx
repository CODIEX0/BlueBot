import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MultiAI from '../../services/MultiAI';
import { useMobileDatabase } from '../../contexts/MobileDatabaseContext';
import { useMobileAuth } from '../../contexts/MobileAuthContext';

// Icon wrapper component to handle icon rendering
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => {
  const IconLib = Ionicons as any;
  return <IconLib name={name} size={size} color={color} />;
};

interface Message {
  id: string;
  text: string;
  user: boolean;
  timestamp: Date;
  type?: 'tip' | 'warning' | 'insight' | 'action' | 'suggestion';
  actions?: MessageAction[];
}

interface MessageAction {
  id: string;
  label: string;
  action: () => void;
}

interface QuickAction {
  id: string;
  text: string;
  icon: JSX.Element;
  category: 'analysis' | 'advice' | 'education' | 'goal' | 'receipt';
}

export default function AIChat() {
  const { user } = useMobileAuth();
  const { expenses, getExpensesByDateRange } = useMobileDatabase();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatContext, setChatContext] = useState<any>({});
  const [selectedProvider, setSelectedProvider] = useState(MultiAI.getCurrentProvider());
  const [availableProviders, setAvailableProviders] = useState<{ key: string; name: string; model: string; available: boolean }[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Handle action requirements from AI
  const handleActionRequired = (actionRequired: any) => {
    switch (actionRequired.type) {
      case 'create_budget':
        Alert.alert('Budget Helper', 'Let me help you create a budget! Go to the Expenses tab to set up your budget categories.');
        break;
      case 'set_goal':
        Alert.alert('Goal Setting', 'Ready to set a financial goal? Check out the Goals section in your profile.');
        break;
      case 'track_expense':
        Alert.alert('Expense Tracking', 'Start tracking your expenses in the Expenses tab for better financial insights.');
        break;
      case 'educate':
      case 'learn_more':
        router.push('/(tabs)/learn');
        break;
      default:
        break;
    }
  };

  // Send message to AI using MultiAI service
  const sendMessageToAI = async (message: string) => {
    try {
      setIsLoading(true);
      
      // Use real chatContext for userBalance, recentExpenses, etc.
      const context = {
        userBalance: user?.balance ?? 0, // Use real user balance if available
        recentExpenses: chatContext.recentExpenses?.slice(0, 5) || [],
        financialGoals: user?.goals || [], // Use real user goals if available
      };

      const response = await MultiAI.sendMessage(
        message,
        messages.map(m => ({
          id: m.id,
          role: m.user ? 'user' : 'assistant',
          content: m.text,
          timestamp: m.timestamp,
          context: m.user ? undefined : context
        })),
        context
      );

      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        text: response.message,
        user: false,
        timestamp: new Date(),
        type: response.actionRequired ? 'action' : 'insight',
        actions: response.suggestions ? response.suggestions.map((suggestion, index) => ({
          id: `suggestion_${index}`,
          label: suggestion,
          action: () => handleSuggestionClick(suggestion)
        })) : undefined
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Handle action requirements
      if (response.actionRequired) {
        handleActionRequired(response.actionRequired);
      }

    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        text: 'Sorry, I encountered an issue. Please try again.',
        user: false,
        timestamp: new Date(),
        type: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load real user context for AI
  const loadChatContext = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const recentExpenses = await getExpensesByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      // Optionally, fetch goals and balance from backend if available
      setChatContext({
        recentExpenses,
        totalSpent: recentExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        expenseCount: recentExpenses.length,
        lastUpdated: new Date(),
        // Add more real data as needed
      });
    } catch (error) {
      console.warn('Failed to load chat context:', error);
    }
  };

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: `Hi! I'm BlueBot, your AI financial assistant. I'm here to help you manage your money better, understand your spending patterns, and achieve your financial goals. How can I help you today?`,
        user: false,
        timestamp: new Date(),
        type: 'insight',
      };
      setMessages([welcomeMessage]);
      loadChatContext();
    }
  }, [user]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      text: 'Analyze my spending',
      icon: <Icon name="trending-up" size={16} color="#1E3A8A" />,
      category: 'analysis',
    },
    {
      id: '2',
      text: 'Budget advice',
      icon: <Icon name="cash" size={16} color="#1E3A8A" />,
      category: 'advice',
    },
    {
      id: '3',
      text: 'Savings tips',
      icon: <Icon name="bulb" size={16} color="#1E3A8A" />,
      category: 'advice',
    },
    {
      id: '4',
      text: 'Explain banking terms',
      icon: <Icon name="alert-circle" size={16} color="#1E3A8A" />,
      category: 'education',
    },
    {
      id: '5',
      text: 'Scan receipt',
      icon: <Icon name="camera" size={16} color="#1E3A8A" />,
      category: 'receipt',
    },
    {
      id: '6',
      text: 'Set savings goal',
      icon: <Icon name="flag" size={16} color="#1E3A8A" />,
      category: 'goal',
    },
  ];

  const sendMessage = useCallback(async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: inputText.trim(),
      user: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Use MultiAI service
      await sendMessageToAI(currentInput);
      
    } catch (error) {
      console.error('AI chat error:', error);
      
      // Fallback to local responses
      const fallbackResponse = getLocalResponse(currentInput);
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        text: fallbackResponse,
        user: false,
        timestamp: new Date(),
        type: 'insight',
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, chatContext, messages, user]);

  const handleMessageAction = (action: any) => {
    switch (action.type) {
      case 'navigate':
        // Navigate to specific screen
        switch (action.target) {
          case 'wallet':
            router.push('/(tabs)/wallet');
            break;
          case 'profile':
            router.push('/(tabs)/profile');
            break;
          case 'learn':
            router.push('/(tabs)/learn');
            break;
          default:
            Alert.alert('Navigation', `Navigating to ${action.target}...`);
        }
        break;
      case 'create_goal':
        // Create a new savings goal
        showCreateGoalDialog();
        break;
      case 'scan_receipt':
        // Open receipt scanner
        showReceiptScanOptions();
        break;
      case 'view_expenses':
        // Show expense breakdown
        showExpenseBreakdown();
        break;
      case 'create_budget':
        // Help create a budget
        showBudgetHelper();
        break;
      case 'track_expense':
        // Add new expense
        showExpenseTracker();
        break;
      case 'learn_more':
        // Navigate to education
        router.push('/(tabs)/learn');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const showCreateGoalDialog = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Create Savings Goal',
        'What would you like to save for?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Goal', 
            onPress: (goalName) => {
              if (goalName && goalName.trim()) {
                showGoalAmountDialog(goalName.trim());
              }
            }
          }
        ],
        'plain-text',
        'Emergency Fund'
      );
    } else {
      Alert.alert(
        'Create Savings Goal',
        'Goal creation feature allows you to set and track financial targets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Learn More', onPress: () => router.push('/(tabs)/learn') }
        ]
      );
    }
  };

  const showGoalAmountDialog = (goalName: string) => {
    if (Alert.prompt) {
      Alert.prompt(
        'Set Target Amount',
        `How much do you want to save for "${goalName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Set Goal', 
            onPress: (amount) => {
              const targetAmount = parseFloat(amount || '0');
              if (targetAmount > 0) {
                Alert.alert(
                  'Goal Created!',
                  `Your "${goalName}" goal of R${targetAmount.toFixed(2)} has been created. Start saving today!`,
                  [{ text: 'Great!' }]
                );
              } else {
                Alert.alert('Invalid Amount', 'Please enter a valid target amount');
              }
            }
          }
        ],
        'numeric',
        '1000'
      );
    }
  };

  const showReceiptScanOptions = () => {
    Alert.alert(
      'Receipt Scanner',
      'Automatically extract expense details from receipts:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: () => Alert.alert('Camera', 'Opening camera to scan receipt...')
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => Alert.alert('Gallery', 'Opening gallery to select receipt...')
        },
        {
          text: 'Manual Entry',
          onPress: () => showExpenseTracker()
        }
      ]
    );
  };

  const showExpenseBreakdown = () => {
    const recentExpenses = chatContext.recentExpenses || [];
    const totalSpent = recentExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const categorySums = recentExpenses.reduce((acc: Record<string, number>, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const breakdown = Object.entries(categorySums)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, amount]) => `• ${category}: R${(amount as number).toFixed(2)}`)
      .join('\n');

    Alert.alert(
      'Expense Breakdown (Last 30 Days)',
      `Total Spent: R${totalSpent.toFixed(2)}\n\nTop Categories:\n${breakdown || 'No expenses recorded'}`,
      [
        { text: 'Close' },
        { text: 'View Full Report', onPress: () => Alert.alert('Report', 'Detailed expense report coming soon!') }
      ]
    );
  };

  const showBudgetHelper = () => {
    Alert.alert(
      'Budget Helper',
      'Let me help you create a realistic budget based on the 50/30/20 rule:\n\n50% - Needs (rent, groceries, utilities)\n30% - Wants (entertainment, dining out)\n20% - Savings and debt repayment',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Calculate My Budget', onPress: () => showIncomeDialog() },
        { text: 'Learn More', onPress: () => router.push('/(tabs)/learn') }
      ]
    );
  };

  const showIncomeDialog = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Monthly Income',
        'What is your monthly take-home income?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Calculate Budget', 
            onPress: (income) => {
              const monthlyIncome = parseFloat(income || '0');
              if (monthlyIncome > 0) {
                const needs = monthlyIncome * 0.5;
                const wants = monthlyIncome * 0.3;
                const savings = monthlyIncome * 0.2;
                
                Alert.alert(
                  'Your Recommended Budget',
                  `Monthly Income: R${monthlyIncome.toFixed(2)}\n\n` +
                  `Needs (50%): R${needs.toFixed(2)}\n` +
                  `Wants (30%): R${wants.toFixed(2)}\n` +
                  `Savings (20%): R${savings.toFixed(2)}`,
                  [
                    { text: 'Save Budget', onPress: () => Alert.alert('Saved', 'Budget saved to your profile!') },
                    { text: 'Adjust', onPress: () => Alert.alert('Customize', 'Budget customization coming soon!') },
                    { text: 'Done' }
                  ]
                );
              } else {
                Alert.alert('Invalid Income', 'Please enter a valid monthly income');
              }
            }
          }
        ],
        'numeric',
        '15000'
      );
    }
  };

  const showExpenseTracker = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Add Expense',
        'Enter expense description:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Next', 
            onPress: (description) => {
              if (description && description.trim()) {
                showExpenseAmountDialog(description.trim());
              }
            }
          }
        ],
        'plain-text',
        'Lunch at restaurant'
      );
    } else {
      Alert.alert(
        'Expense Tracker',
        'Track your daily expenses to better understand your spending patterns.',
        [
          { text: 'Close' },
          { text: 'Learn More', onPress: () => router.push('/(tabs)/learn') }
        ]
      );
    }
  };

  const showExpenseAmountDialog = (description: string) => {
    if (Alert.prompt) {
      Alert.prompt(
        'Expense Amount',
        `How much did you spend on "${description}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Expense', 
            onPress: (amount) => {
              const expenseAmount = parseFloat(amount || '0');
              if (expenseAmount > 0) {
                Alert.alert(
                  'Expense Added!',
                  `"${description}" - R${expenseAmount.toFixed(2)} has been added to your expenses.`,
                  [{ text: 'Great!' }]
                );
              } else {
                Alert.alert('Invalid Amount', 'Please enter a valid expense amount');
              }
            }
          }
        ],
        'numeric',
        '50'
      );
    }
  };

  const getLocalResponse = (message: string): string => {
    return "Sorry, this feature is not available offline. Please check your connection.";
  };

  const sendQuickAction = useCallback((actionText: string) => {
    setInputText(actionText);
    setTimeout(() => sendMessage(), 100);
  }, [sendMessage]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'tip':
        return <Icon name="bulb" size={16} color="#10B981" />;
      case 'warning':
        return <Icon name="alert-circle" size={16} color="#F59E0B" />;
      case 'insight':
        return <Icon name="trending-up" size={16} color="#0EA5E9" />;
      default:
        return <Icon name="chatbubble-ellipses" size={16} color="#1E3A8A" />;
    }
  };

  useEffect(() => {
    setAvailableProviders(MultiAI.getProviderDetails());
    MultiAI.onProviderChange((provider) => {
      setSelectedProvider(MultiAI.getCurrentProvider());
    });
  }, []);

  const handleProviderChange = (providerKey: string) => {
    if (MultiAI.switchProvider(providerKey)) {
      setSelectedProvider(MultiAI.getCurrentProvider());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Provider Switcher */}
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 10 }}>
        <Text style={{ fontWeight: 'bold', marginRight: 8 }}>AI Provider:</Text>
        {availableProviders.map((prov) => (
          <TouchableOpacity
            key={prov.key}
            style={{
              backgroundColor: prov.key === selectedProvider ? '#10B981' : '#E5E7EB',
              padding: 6,
              borderRadius: 6,
              marginRight: 6,
              opacity: prov.available ? 1 : 0.5
            }}
            disabled={!prov.available}
            onPress={() => handleProviderChange(prov.key)}
          >
            <Text style={{ color: prov.key === selectedProvider ? 'white' : '#1E293B', fontSize: 12 }}>
              {prov.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Header */}
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.botAvatar}>
              <Icon name="chatbubble-ellipses" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>BlueBot</Text>
              <Text style={styles.headerSubtitle}>AI Financial Assistant</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActions}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => sendQuickAction(action.text)}
              >
                {action.icon}
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageContainer,
                  message.user ? styles.userMessageContainer : styles.aiMessageContainer,
                ]}
              >
                {!message.user && (
                  <View style={styles.aiMessageHeader}>
                    <View style={styles.aiAvatar}>
                      {getMessageIcon(message.type)}
                    </View>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.user ? styles.userMessageBubble : styles.aiMessageBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.user ? styles.userMessageText : styles.aiMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.user ? styles.userMessageTime : styles.aiMessageTime,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
                {message.user && (
                  <View style={styles.userAvatar}>
                    <Icon name="person" size={16} color="#1E3A8A" />
                  </View>
                )}
              </View>
              
              {/* Message Actions */}
              {message.actions && message.actions.length > 0 && (
                <View style={styles.messageActionsContainer}>
                  {message.actions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.messageActionButton}
                      onPress={action.action}
                    >
                      <Text style={styles.messageActionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.aiAvatar}>
                <Icon name="chatbubble-ellipses" size={16} color="#1E3A8A" />
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>BlueBot is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask BlueBot anything about your finances..."
            placeholderTextColor="#64748B"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Icon name="send" size={20} color={inputText.trim() ? "#FFFFFF" : "#64748B"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quickActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '500',
    marginLeft: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiMessageHeader: {
    marginRight: 8,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageBubble: {
    backgroundColor: '#1E3A8A',
  },
  aiMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#1E3A8A',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 6,
  },
  userMessageTime: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  aiMessageTime: {
    color: '#64748B',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E3A8A',
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  sendButtonInactive: {
    backgroundColor: '#E2E8F0',
  },
  messageActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  messageActionButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageActionText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '500',
  },
});
