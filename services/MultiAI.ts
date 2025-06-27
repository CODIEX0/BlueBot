/**
 * Multi-AI Service for BlueBot
 * Supports multiple AI providers: DeepSeek, Google Gemini, and Local Llama
 */

interface AIProvider {
  name: string;
  apiKey?: string;
  baseURL?: string;
  model: string;
  available: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: string;
  context?: {
    userBalance?: number;
    recentExpenses?: Array<{
      amount: number;
      category: string;
      date: string;
    }>;
    financialGoals?: Array<{
      title: string;
      targetAmount: number;
      currentAmount: number;
    }>;
  };
}

interface AIResponse {
  message: string;
  suggestions?: string[];
  actionRequired?: {
    type: 'create_budget' | 'set_goal' | 'track_expense' | 'learn_more' | 'educate';
    data?: any;
  };
  provider: string;
  confidence?: number;
}

class MultiAIService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = 'deepseek';
  private fallbackOrder: string[] = ['deepseek', 'gemini', 'local', 'mock'];

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all AI providers
   */
  private initializeProviders() {
    // DeepSeek - Primary provider
    this.providers.set('deepseek', {
      name: 'DeepSeek',
      apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      available: !!process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY
    });

    // Google Gemini - Free tier with good capabilities
    this.providers.set('gemini', {
      name: 'Google Gemini',
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-pro',
      available: !!process.env.EXPO_PUBLIC_GEMINI_API_KEY
    });

    // Local Llama - For offline usage (requires local setup)
    this.providers.set('local', {
      name: 'Local Llama',
      baseURL: 'http://localhost:11434/api',
      model: 'llama3.2:1b', // Lightweight model for mobile
      available: false // Will check availability on first use
    });

    // Mock provider for development
    this.providers.set('mock', {
      name: 'Mock AI',
      model: 'mock',
      available: true
    });
  }

  /**
   * Send message to AI with automatic fallback
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    let lastError: Error | null = null;

    // Try providers in fallback order
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.available) continue;

      try {
        console.log(`Attempting to use provider: ${provider.name}`);
        
        const response = await this.sendToProvider(
          providerName,
          message,
          conversationHistory,
          userContext
        );
        
        // Update current provider on success
        this.currentProvider = providerName;
        return response;
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        lastError = error as Error;
        
        // Mark provider as temporarily unavailable if it's an API error
        if (error instanceof Error && error.message.includes('API')) {
          provider.available = false;
          // Re-enable after 5 minutes
          setTimeout(() => {
            provider.available = true;
          }, 5 * 60 * 1000);
        }
      }
    }

    // If all providers fail, return error response
    return {
      message: `I'm having trouble connecting to my services right now. ${lastError?.message || 'Please try again later.'}`,
      suggestions: ['Check your internet connection', 'Try again in a few moments'],
      provider: 'error'
    };
  }

  /**
   * Send message to specific provider
   */
  private async sendToProvider(
    providerName: string,
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Provider ${providerName} not found`);

    switch (providerName) {
      case 'deepseek':
        return this.sendToDeepSeek(message, conversationHistory, userContext);
      case 'gemini':
        return this.sendToGemini(message, conversationHistory, userContext);
      case 'local':
        return this.sendToLocalLlama(message, conversationHistory, userContext);
      case 'mock':
        return this.sendToMockProvider(message, conversationHistory, userContext);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  /**
   * DeepSeek API implementation
   */
  private async sendToDeepSeek(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('deepseek')!;
    
    const systemPrompt = this.buildSystemPrompt(userContext);
    const messages = this.buildMessageHistory(systemPrompt, conversationHistory, message);

    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'DeepSeek'
    };
  }

  /**
   * Google Gemini API implementation
   */
  private async sendToGemini(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('gemini')!;
    
    // Gemini uses a different format
    const systemPrompt = this.buildSystemPrompt(userContext);
    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}\n\nAssistant:`;

    const response = await fetch(
      `${provider.baseURL}/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.8,
            topK: 10
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'Gemini'
    };
  }

  /**
   * Local Llama implementation (Ollama)
   */
  private async sendToLocalLlama(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('local')!;

    // Check if local server is available
    try {
      const healthCheck = await fetch(`${provider.baseURL}/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (!healthCheck.ok) {
        provider.available = false;
        throw new Error('Local Llama server not available');
      }
    } catch (error) {
      provider.available = false;
      throw new Error('Local Llama server not reachable');
    }

    const systemPrompt = this.buildSystemPrompt(userContext);
    const messages = this.buildMessageHistory(systemPrompt, conversationHistory, message);

    const response = await fetch(`${provider.baseURL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.8,
          max_tokens: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Local Llama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.response || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'Local Llama'
    };
  }

  /**
   * Mock provider for development/testing
   */
  private async sendToMockProvider(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const lowerMessage = message.toLowerCase();

    // Enhanced mock responses for education
    if (lowerMessage.includes('learn') || lowerMessage.includes('education') || lowerMessage.includes('teach')) {
      return {
        message: `Great choice! Learning about finance is one of the best investments you can make. I can help you with budgeting basics, understanding South African banking, investment options like the JSE, and even cryptocurrency for unbanked users. What specific topic interests you most?`,
        suggestions: [
          'Start with budgeting fundamentals',
          'Learn about South African financial products',
          'Understand cryptocurrency basics'
        ],
        actionRequired: {
          type: 'educate',
          data: { topic: 'general' }
        },
        provider: 'Mock AI',
        confidence: 0.85
      };
    }

    // Budget-related queries
    if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
      return {
        message: `Let's create a budget that works for South African conditions! I recommend starting with the 50/30/20 rule adapted for our economy: 50% for essentials (rent, groceries, transport), 30% for lifestyle (but be mindful of current interest rates), and 20% for savings and debt repayment. Given load-shedding and economic challenges, having an emergency fund is crucial!`,
        suggestions: [
          'Track your expenses for a week first',
          'Set up automatic savings transfers',
          'Consider the impact of electricity costs'
        ],
        actionRequired: {
          type: 'create_budget'
        },
        provider: 'Mock AI',
        confidence: 0.9
      };
    }

    // Investment and savings
    if (lowerMessage.includes('invest') || lowerMessage.includes('save')) {
      return {
        message: `Smart thinking about investments! In South Africa, you have great options: Tax-Free Savings Accounts (R36,000 annual limit), JSE-listed ETFs for diversification, and even crypto through regulated platforms like Luno. For beginners, I suggest starting with low-cost index funds that track the JSE Top 40. Remember, time in the market beats timing the market!`,
        suggestions: [
          'Open a TFSA with a major bank',
          'Research JSE ETFs like STXIND or PTXTEN',
          'Start with R500/month if possible'
        ],
        actionRequired: {
          type: 'learn_more',
          data: { topic: 'investing' }
        },
        provider: 'Mock AI',
        confidence: 0.88
      };
    }

    // Default helpful response
    return {
      message: `Hi there! I'm BlueBot, your South African financial assistant. I'm here to help you navigate everything from basic budgeting to understanding local banking, investments, and even crypto options for unbanked users. I speak your language and understand our unique economic challenges. What would you like to explore today?`,
      suggestions: [
        'Help me create a monthly budget',
        'Explain South African investment options',
        'Learn about financial basics'
      ],
      provider: 'Mock AI',
      confidence: 0.8
    };
  }

  /**
   * Build system prompt with SA context
   */
  private buildSystemPrompt(userContext?: ChatMessage['context']): string {
    const basePrompt = `You are BlueBot, a helpful financial assistant specifically designed for South African users. You provide practical, actionable financial advice tailored to the South African context.

Key guidelines:
- Use South African terminology (Rand, ZAR, SARB, POPIA, SARS, JSE, etc.)
- Reference South African financial institutions (Standard Bank, FNB, Capitec, Nedbank, etc.)
- Consider local economic conditions (load-shedding, interest rates, inflation)
- Promote financial literacy and responsible spending
- Be empathetic to users who may be unbanked or have limited financial access
- Provide advice that considers South African laws and regulations
- Focus on practical, achievable financial goals

You help users with:
- Budgeting and expense tracking adapted to SA conditions
- Savings goals and local investment strategies
- Understanding South African banking and financial products
- Cryptocurrency and digital payments for unbanked users
- Financial education with local examples
- Tax-efficient investing (TFSA, retirement annuities)
- Debt management under the National Credit Act

Always be encouraging, supportive, and provide specific, actionable advice relevant to South Africa.`;

    if (userContext) {
      let contextInfo = '\n\nCurrent user context:';
      
      if (userContext.userBalance !== undefined) {
        contextInfo += `\n- Current balance: R${userContext.userBalance.toFixed(2)}`;
      }
      
      if (userContext.recentExpenses && userContext.recentExpenses.length > 0) {
        contextInfo += '\n- Recent expenses:';
        userContext.recentExpenses.slice(0, 3).forEach(expense => {
          contextInfo += `\n  • R${expense.amount.toFixed(2)} on ${expense.category} (${expense.date})`;
        });
      }
      
      if (userContext.financialGoals && userContext.financialGoals.length > 0) {
        contextInfo += '\n- Financial goals:';
        userContext.financialGoals.slice(0, 2).forEach(goal => {
          const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
          contextInfo += `\n  • ${goal.title}: R${goal.currentAmount.toFixed(2)} / R${goal.targetAmount.toFixed(2)} (${progress}%)`;
        });
      }
      
      return basePrompt + contextInfo;
    }

    return basePrompt;
  }

  /**
   * Build message history for AI context
   */
  private buildMessageHistory(
    systemPrompt: string,
    history: ChatMessage[],
    currentMessage: string
  ): Array<{role: string; content: string}> {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 10 messages)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * Parse AI response for actions and suggestions
   */
  private parseAIResponse(response: string): Omit<AIResponse, 'provider'> {
    const result: Omit<AIResponse, 'provider'> = {
      message: response
    };

    // Look for action indicators in the response
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('create a budget') || lowerResponse.includes('set up a budget')) {
      result.actionRequired = { type: 'create_budget' };
    } else if (lowerResponse.includes('set a goal') || lowerResponse.includes('savings goal')) {
      result.actionRequired = { type: 'set_goal' };
    } else if (lowerResponse.includes('track') && lowerResponse.includes('expense')) {
      result.actionRequired = { type: 'track_expense' };
    } else if (lowerResponse.includes('learn more') || lowerResponse.includes('educational') || lowerResponse.includes('teach')) {
      result.actionRequired = { type: 'educate' };
    }

    // Extract suggestions if present
    const suggestionPatterns = [
      /(?:I suggest|I recommend|You could|Try to|Consider)([^.!?]+)/gi,
      /(?:Maybe|Perhaps|You might want to)([^.!?]+)/gi
    ];

    const suggestions: string[] = [];
    suggestionPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^(I suggest|I recommend|You could|Try to|Consider|Maybe|Perhaps|You might want to)\s*/i, '').trim();
          if (cleaned.length > 10) {
            suggestions.push(cleaned);
          }
        });
      }
    });

    if (suggestions.length > 0) {
      result.suggestions = suggestions.slice(0, 3); // Limit to 3 suggestions
    }

    return result;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.available)
      .map(([name, provider]) => `${name} (${provider.name})`);
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): string {
    const provider = this.providers.get(this.currentProvider);
    return provider ? provider.name : 'Unknown';
  }

  /**
   * Switch provider manually
   */
  switchProvider(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    if (provider && provider.available) {
      this.currentProvider = providerName;
      return true;
    }
    return false;
  }

  /**
   * Test provider connectivity
   */
  async testProvider(providerName: string): Promise<boolean> {
    try {
      const testResponse = await this.sendToProvider(
        providerName,
        'Hello, this is a test message.',
        []
      );
      return testResponse.provider !== 'error';
    } catch (error) {
      console.error(`Provider ${providerName} test failed:`, error);
      return false;
    }
  }
}

export default new MultiAIService();
export type { ChatMessage, AIResponse, AIProvider };
