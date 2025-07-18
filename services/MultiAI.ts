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
  metadata?: {
    provider?: string;
    responseTime?: number;
    model?: string;
    timestamp?: string;
    error?: string;
    attemptedProviders?: string[];
  };
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
    // DeepSeek - Primary provider (production-ready)
    this.providers.set('deepseek', {
      name: 'DeepSeek',
      apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      available: !!process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY && 
                process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY.startsWith('sk-')
    });

    // Google Gemini - Free tier with good capabilities (production-ready)
    this.providers.set('gemini', {
      name: 'Google Gemini',
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-1.5-flash', // Updated to latest model
      available: !!process.env.EXPO_PUBLIC_GEMINI_API_KEY && 
                process.env.EXPO_PUBLIC_GEMINI_API_KEY.startsWith('AIza')
    });

    // OpenAI - Fallback provider
    this.providers.set('openai', {
      name: 'OpenAI',
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini', // Cost-effective model
      available: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY && 
                process.env.EXPO_PUBLIC_OPENAI_API_KEY.startsWith('sk-')
    });

    // Local Llama - For offline usage (production-ready for local deployment)
    this.providers.set('local', {
      name: 'Local Llama',
      baseURL: 'http://localhost:11434/api',
      model: 'llama3.2:3b', // More capable model
      available: false // Will check availability on first use
    });

    // Anthropic Claude - High-quality alternative
    this.providers.set('claude', {
      name: 'Anthropic Claude',
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
      baseURL: 'https://api.anthropic.com/v1',
      model: 'claude-3-haiku-20240307', // Fast and cost-effective
      available: !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY && 
                process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY.startsWith('sk-ant-')
    });

    // OpenRouter - Community AI API
    this.providers.set('openrouter', {
      name: 'OpenRouter',
      apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'openrouter-gpt-4', // Example model, update as needed
      available: !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY && process.env.EXPO_PUBLIC_OPENROUTER_API_KEY.length > 0
    });

    // Mock provider only for development/testing
    this.providers.set('mock', {
      name: 'Mock AI',
      model: 'mock',
      available: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    });

    // Update fallback order to prioritize production providers
    this.fallbackOrder = [
      'deepseek',   // Primary - good balance of quality and cost
      'gemini',     // Free tier available
      'openai',     // Reliable fallback
      'openrouter', // Add OpenRouter to fallback order
      'claude',     // High quality alternative
      'local',      // Offline capability
      'mock'        // Development only
    ];
  }

  /**
   * Send message to AI with automatic fallback and comprehensive error handling
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    // Input validation
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 5000) {
      throw new Error('Message too long. Please keep it under 5000 characters.');
    }

    let lastError: Error | null = null;
    const attemptedProviders: string[] = [];

    // Try providers in fallback order
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.available) {
        console.log(`Skipping provider ${providerName}: ${!provider ? 'not found' : 'not available'}`);
        continue;
      }

      attemptedProviders.push(providerName);

      try {
        console.log(`Attempting to use provider: ${provider.name}`);
        
        const startTime = Date.now();
        const response = await this.sendToProvider(
          providerName,
          message,
          conversationHistory,
          userContext
        );
        const responseTime = Date.now() - startTime;
        
        // Update current provider on success
        this.currentProvider = providerName;
        
        // Log successful response for monitoring
        console.log(`Provider ${provider.name} succeeded in ${responseTime}ms`);
        
        // Add response metadata
        response.metadata = {
          provider: provider.name,
          responseTime,
          model: provider.model,
          timestamp: new Date().toISOString()
        };
        
        return response;
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        lastError = error as Error;
        
        // Mark provider as temporarily unavailable if it's an API error
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          
          if (errorMessage.includes('401') || errorMessage.includes('403')) {
            // Authentication error - mark as permanently unavailable
            provider.available = false;
            console.error(`Provider ${provider.name} has authentication issues`);
          } else if (errorMessage.includes('429')) {
            // Rate limiting - temporary unavailability
            provider.available = false;
            setTimeout(() => {
              provider.available = true;
            }, 60000); // Re-enable after 1 minute
          } else if (errorMessage.includes('500') || errorMessage.includes('502') || 
                    errorMessage.includes('503') || errorMessage.includes('504')) {
            // Server errors - temporary unavailability
            provider.available = false;
            setTimeout(() => {
              provider.available = true;
            }, 30000); // Re-enable after 30 seconds
          }
        }
      }
    }

    // If all providers fail, return comprehensive error response
    const errorMessage = this.buildErrorMessage(lastError, attemptedProviders);
    
    return {
      message: errorMessage,
      suggestions: [
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the problem persists'
      ],
      provider: 'error',
      metadata: {
        error: lastError?.message || 'Unknown error',
        attemptedProviders,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Build comprehensive error message
   */
  private buildErrorMessage(error: Error | null, attemptedProviders: string[]): string {
    if (attemptedProviders.length === 0) {
      return "I'm currently not connected to any AI services. Please check your configuration and try again.";
    }

    if (error?.message.includes('network') || error?.message.includes('timeout')) {
      return "I'm having trouble connecting to my AI services due to network issues. Please check your internet connection and try again.";
    }

    if (error?.message.includes('401') || error?.message.includes('403')) {
      return "There's an authentication issue with my AI services. Please contact support.";
    }

    if (error?.message.includes('429')) {
      return "I'm currently receiving too many requests. Please wait a moment and try again.";
    }

    return `I'm experiencing technical difficulties with my AI services. I tried ${attemptedProviders.length} provider(s) but none are currently available. Please try again later.`;
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

    // Add request timeout and retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        switch (providerName) {
          case 'deepseek':
            return await this.sendToDeepSeek(message, conversationHistory, userContext);
          case 'gemini':
            return await this.sendToGemini(message, conversationHistory, userContext);
          case 'openai':
            return await this.sendToOpenAI(message, conversationHistory, userContext);
          case 'claude':
            return await this.sendToClaude(message, conversationHistory, userContext);
          case 'local':
            return await this.sendToLocalLlama(message, conversationHistory, userContext);
          case 'mock':
            return await this.sendToMockProvider(message, conversationHistory, userContext);
          case 'openrouter':
            return await this.sendToOpenRouter(message, conversationHistory, userContext);
          default:
            throw new Error(`Unknown provider: ${providerName}`);
        }
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for certain errors
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('403')) {
            // Authentication errors - don't retry
            throw error;
          }
          if (error.message.includes('429')) {
            // Rate limiting - wait before retry
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw lastError || new Error('Max retries exceeded');
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
        signal: AbortSignal.timeout(30000), // 30 second timeout
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
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'Gemini',
      confidence: data.candidates?.[0]?.safetyRatings ? 0.9 : 0.8
    };
  }

  /**
   * OpenAI API implementation
   */
  private async sendToOpenAI(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('openai')!;
    
    const systemPrompt = this.buildSystemPrompt(userContext);
    const messages = this.buildMessageHistory(systemPrompt, conversationHistory, message);

    const response = await fetch(`${provider.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'User-Agent': 'BlueBot/1.0'
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'OpenAI',
      confidence: 0.95
    };
  }

  /**
   * Anthropic Claude API implementation
   */
  private async sendToClaude(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('claude')!;
    
    const systemPrompt = this.buildSystemPrompt(userContext);
    
    // Claude has a different message format
    const messages = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    messages.push({ role: 'user', content: message });

    const response = await fetch(`${provider.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'BlueBot/1.0'
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const aiMessage = data.content?.[0]?.text || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'Claude',
      confidence: 0.92
    };
  }

  /**
   * Local Llama implementation (Ollama) - Production Ready
   */
  private async sendToLocalLlama(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('local')!;

    // Check if local server is available with proper health check
    try {
      const healthCheck = await fetch(`${provider.baseURL}/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });
      
      if (!healthCheck.ok) {
        provider.available = false;
        throw new Error('Local Llama server not available');
      }
      
      // Update availability status
      provider.available = true;
    } catch (error) {
      provider.available = false;
      throw new Error(`Local Llama server not reachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const systemPrompt = this.buildSystemPrompt(userContext);
    
    // Build conversation context for Ollama
    const conversationText = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationText}\nHuman: ${message}\nAssistant:`;

    const response = await fetch(`${provider.baseURL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(45000), // 45 second timeout for generation
      body: JSON.stringify({
        model: provider.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.8,
          top_k: 40,
          max_tokens: 500,
          repeat_penalty: 1.1,
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local Llama error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const aiMessage = data.response || 'Sorry, I couldn\'t process that request.';

    return {
      ...this.parseAIResponse(aiMessage),
      provider: 'Local Llama',
      confidence: 0.85
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
   * List all available provider keys
   */
  listProviderKeys(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider details for UI display
   */
  getProviderDetails(): { key: string; name: string; model: string; available: boolean }[] {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      key,
      name: provider.name,
      model: provider.model,
      available: provider.available
    }));
  }

  /**
   * Register a callback for provider change (for UI updates)
   */
  private providerChangeCallbacks: Array<(provider: string) => void> = [];
  onProviderChange(cb: (provider: string) => void) {
    this.providerChangeCallbacks.push(cb);
  }
  private notifyProviderChange() {
    this.providerChangeCallbacks.forEach(cb => cb(this.currentProvider));
  }

  /**
   * Switch provider manually and notify listeners
   */
  switchProvider(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    if (provider && provider.available) {
      this.currentProvider = providerName;
      this.notifyProviderChange();
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

  /**
   * Send message to OpenRouter provider
   */
  private async sendToOpenRouter(
    message: string,
    conversationHistory: ChatMessage[],
    userContext?: ChatMessage['context']
  ): Promise<AIResponse> {
    const provider = this.providers.get('openrouter');
    if (!provider || !provider.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }
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
        messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '';
    return {
      message: aiMessage,
      provider: 'openrouter',
      confidence: 0.9,
      metadata: {
        model: provider.model,
        responseTime: 0,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default new MultiAIService();
export type { ChatMessage, AIResponse, AIProvider };
