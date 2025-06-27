import React from 'react';
const { useState, useCallback, useEffect, useRef } = React;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatContext, setChatContext] = useState<any>({});
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
        Alert.alert('Financial Education', 'Check out our education modules to learn more about this topic!');
        break;
      default:
        break;
    }
  };

  // Send message to AI using MultiAI service
  const sendMessageToAI = async (message: string) => {
    try {
      setIsLoading(true);
      
      // Get user context for better AI responses
      const context = {
        userBalance: 15000, // This would come from real data
        recentExpenses: chatContext.recentExpenses?.slice(0, 5) || [],
        financialGoals: [
          { title: 'Emergency Fund', targetAmount: 10000, currentAmount: 3500 },
        ]
      };

      const response = await MultiAI.sendMessage(message, messages.map(m => ({
        id: m.id,
        role: m.user ? 'user' : 'assistant',
        content: m.text,
        timestamp: m.timestamp,
        context: m.user ? undefined : context
      })), context);

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

  const loadChatContext = async () => {
    try {
      // Load recent expenses and financial data for context
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const recentExpenses = await getExpensesByDateRange(
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
      );
      
      setChatContext({
        recentExpenses,
        totalSpent: recentExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        expenseCount: recentExpenses.length,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.warn('Failed to load chat context:', error);
    }
  };

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
        Alert.alert('Navigation', `Would navigate to ${action.target}`);
        break;
      case 'create_goal':
        // Create a new savings goal
        Alert.alert('Create Goal', 'Goal creation feature coming soon!');
        break;
      case 'scan_receipt':
        // Open receipt scanner
        Alert.alert('Scan Receipt', 'Receipt scanning feature coming soon!');
        break;
      case 'view_expenses':
        // Show expense breakdown
        Alert.alert('View Expenses', 'Expense details feature coming soon!');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const getLocalResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('spending') || lowerMessage.includes('analyze')) {
      const totalSpent = chatContext.totalSpent || 0;
      const expenseCount = chatContext.expenseCount || 0;
      return `I've analyzed your recent spending. You've spent R${totalSpent.toFixed(2)} across ${expenseCount} transactions this month. Would you like me to break this down by category or suggest ways to optimize your spending?`;
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('advice')) {
      return "Based on South African financial best practices, I recommend the 50/30/20 rule: 50% for needs (rent, groceries, transport), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment. Would you like me to help you create a personalized budget?";
    }
    
    if (lowerMessage.includes('save') || lowerMessage.includes('savings')) {
      return "Here are some South African savings tips tailored for you: 1) Consider a tax-free savings account (TFSA) - save up to R36,000/year tax-free. 2) Look into unit trusts for long-term growth. 3) Use the envelope method for monthly budgeting. Would you like specific advice for any of these?";
    }
    
    if (lowerMessage.includes('goal')) {
      return "Setting financial goals is crucial! Popular goals include emergency funds (3-6 months expenses), home deposits (typically 10% of property value), and retirement savings. What financial goal would you like to work towards?";
    }
    
    if (lowerMessage.includes('receipt') || lowerMessage.includes('scan')) {
      return "I can help you track expenses by scanning receipts! Just tap the 'Scan receipt' button or use the camera feature. I'll automatically categorize your purchases and add them to your expense tracking.";
    }
    
    return "I'm here to help with your financial questions! I can analyze spending, provide budget advice, help set savings goals, scan receipts, or explain financial concepts. What would you like to focus on today?";
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
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
