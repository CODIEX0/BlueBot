import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import {
  Send,
  Bot,
  User,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  DollarSign,
} from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  user: boolean;
  timestamp: Date;
  type?: 'tip' | 'warning' | 'insight';
}

interface QuickAction {
  id: string;
  text: string;
  icon: React.ReactNode;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm BlueBot, your AI financial assistant. I'm here to help you manage your money better, understand your spending patterns, and achieve your financial goals. How can I help you today?",
      user: false,
      timestamp: new Date(),
      type: 'insight',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      text: 'Analyze my spending',
      icon: <TrendingUp size={16} color="#1E3A8A" />,
    },
    {
      id: '2',
      text: 'Budget advice',
      icon: <DollarSign size={16} color="#1E3A8A" />,
    },
    {
      id: '3',
      text: 'Savings tips',
      icon: <Lightbulb size={16} color="#1E3A8A" />,
    },
    {
      id: '4',
      text: 'Explain banking terms',
      icon: <AlertCircle size={16} color="#1E3A8A" />,
    },
  ];

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('spending') || lowerMessage.includes('analyze')) {
      return "I've analyzed your spending patterns over the last 30 days. You've spent R4,567 this month, with 35% going to groceries, 20% to transport, and 15% to entertainment. Your grocery spending is 12% higher than last month. Consider setting a weekly grocery budget to help control costs.";
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('advice')) {
      return "Based on your income of R15,000, I recommend the 50/30/20 rule: 50% (R7,500) for needs like rent and groceries, 30% (R4,500) for wants like entertainment, and 20% (R3,000) for savings and debt repayment. You're currently spending R5,200 on needs and R3,400 on wants, leaving R6,400 unallocated. Great opportunity to boost your savings!";
    }
    
    if (lowerMessage.includes('save') || lowerMessage.includes('savings')) {
      return "Here are 3 personalized savings tips: 1) Switch to generic brands for groceries - could save R200/month. 2) Use public transport twice a week instead of Uber - save R300/month. 3) Cook at home 2 more times per week - save R400/month. These small changes could help you save R900 monthly toward your emergency fund goal!";
    }
    
    if (lowerMessage.includes('goal') || lowerMessage.includes('emergency')) {
      return "Your emergency fund goal of R10,000 is excellent! You're currently 72.5% there with R7,250 saved. At your current saving rate, you'll reach your goal in 3 months. To accelerate this, consider automatically transferring R500 after each payday to your savings account.";
    }
    
    if (lowerMessage.includes('debt') || lowerMessage.includes('credit')) {
      return "Managing debt wisely is crucial for financial health. Pay off high-interest debt first (like credit cards), make minimum payments on all debts, and avoid taking on new debt. If you have multiple debts, consider the debt snowball method - pay minimums on all debts, then put extra money toward the smallest debt first.";
    }
    
    return "I understand you're asking about your finances. Could you be more specific? I can help with budgeting, spending analysis, savings goals, debt management, or explain banking concepts. What would you like to focus on?";
  };

  const sendMessage = useCallback(() => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: inputText.trim(),
      user: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now().toString() + '-ai',
        text: simulateAIResponse(inputText.trim()),
        user: false,
        timestamp: new Date(),
        type: 'insight',
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  }, [inputText]);

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
        return <Lightbulb size={16} color="#10B981" />;
      case 'warning':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'insight':
        return <TrendingUp size={16} color="#0EA5E9" />;
      default:
        return <Bot size={16} color="#1E3A8A" />;
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
              <Bot size={24} color="#FFFFFF" />
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
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
        >
          {messages.map((message) => (
            <View
              key={message.id}
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
                  <User size={16} color="#1E3A8A" />
                </View>
              )}
            </View>
          ))}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.aiAvatar}>
                <Bot size={16} color="#1E3A8A" />
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>BlueBot is typing...</Text>
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
            <Send size={20} color={inputText.trim() ? "#FFFFFF" : "#64748B"} />
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
});