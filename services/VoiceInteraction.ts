/**
 * Voice Interaction Service
 * Handles text-to-speech and speech-to-text for BlueBot
 * Integrates with ElevenLabs API and Expo Speech
 */

import * as Speech from 'expo-speech';

interface VoiceConfig {
  enabled: boolean;
  language: string;
  voiceId: string;
  speed: number;
  pitch: number;
  personality: 'professional' | 'friendly' | 'energetic' | 'calm';
}

interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description: string;
  category: string;
  labels: {
    accent?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  preview_url: string;
}

class VoiceInteractionService {
  private config: VoiceConfig;
  private elevenLabsApiKey: string;
  private elevenLabsBaseUrl: string = 'https://api.elevenlabs.io/v1';
  private isInitialized: boolean = false;
  private availableVoices: ElevenLabsVoice[] = [];

  // Predefined voice personalities for different providers
  private voicePersonalities = {
    professional: {
      elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Professional
      expoVoice: 'en-US-male-1',
      speed: 0.9,
      pitch: 1.0,
      description: 'Clear, authoritative, and trustworthy voice for financial advice'
    },
    friendly: {
      elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - Friendly
      expoVoice: 'en-US-female-1',
      speed: 1.0,
      pitch: 1.1,
      description: 'Warm, approachable voice that makes finance feel accessible'
    },
    energetic: {
      elevenLabsVoiceId: 'IKne3meq5aSn9XLyUdCD', // Charlie - Energetic
      expoVoice: 'en-US-male-2',
      speed: 1.1,
      pitch: 1.2,
      description: 'Enthusiastic voice that motivates financial growth'
    },
    calm: {
      elevenLabsVoiceId: 'oWAxZDx7w5VEj9dCyTzz', // Grace - Calm
      expoVoice: 'en-US-female-2',
      speed: 0.8,
      pitch: 0.9,
      description: 'Soothing voice that reduces financial anxiety'
    }
  };

  constructor() {
    this.config = {
      enabled: false,
      language: 'en-US',
      voiceId: 'professional',
      speed: 1.0,
      pitch: 1.0,
      personality: 'professional'
    };
    
    this.elevenLabsApiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
  }

  /**
   * Initialize the voice service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if speech synthesis is available
      const speechAvailable = await Speech.isSpeakingAsync();
      
      // Load available voices
      await this.loadAvailableVoices();
      
      this.isInitialized = true;
      console.log('Voice service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      return false;
    }
  }

  /**
   * Update voice configuration
   */
  updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Speak text using the configured voice service
   */
  async speak(text: string, options?: Partial<SpeechOptions>): Promise<void> {
    if (!this.config.enabled) {
      console.log('Voice is disabled');
      return;
    }

    try {
      // Clean and prepare text for speech
      const cleanText = this.prepareTextForSpeech(text);
      
      // Try ElevenLabs first if API key is available
      if (this.elevenLabsApiKey) {
        await this.speakWithElevenLabs(cleanText, options);
      } else {
        // Fallback to Expo Speech
        await this.speakWithExpo(cleanText, options);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      // Try fallback method
      try {
        await this.speakWithExpo(text, options);
      } catch (fallbackError) {
        console.error('Fallback speech synthesis failed:', fallbackError);
      }
    }
  }

  /**
   * Speak using ElevenLabs API
   */
  private async speakWithElevenLabs(text: string, options?: Partial<SpeechOptions>): Promise<void> {
    const personality = this.voicePersonalities[this.config.personality];
    const voiceId = personality.elevenLabsVoiceId;

    const response = await fetch(
      `${this.elevenLabsBaseUrl}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // For React Native, we would need to handle audio playback
    // This would require additional audio libraries like expo-av
    console.log('ElevenLabs audio generated successfully');
    
    // For now, fallback to Expo Speech
    await this.speakWithExpo(text, options);
  }

  /**
   * Speak using Expo Speech (native TTS)
   */
  private async speakWithExpo(text: string, options?: Partial<SpeechOptions>): Promise<void> {
    const personality = this.voicePersonalities[this.config.personality];
    
    const speechOptions: Speech.SpeechOptions = {
      language: options?.language || this.config.language,
      pitch: options?.pitch || personality.pitch || this.config.pitch,
      rate: options?.rate || personality.speed || this.config.speed,
      voice: options?.voice || personality.expoVoice,
    };

    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        ...speechOptions,
        onDone: () => resolve(),
        onError: (error) => reject(error),
        onStopped: () => resolve(),
      });
    });
  }

  /**
   * Stop current speech
   */
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('Error checking speech status:', error);
      return false;
    }
  }

  /**
   * Start listening for speech input
   * Note: This would require additional setup with expo-speech or react-native-voice
   */
  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      // This is a placeholder for speech recognition
      // In a real implementation, you would use:
      // - expo-speech for basic recognition
      // - react-native-voice for advanced features
      // - Web Speech API for web platforms
      
      console.log('Starting speech recognition...');
      
      // Simulate speech recognition for demo
      setTimeout(() => {
        const simulatedResults = [
          "How much should I save each month?",
          "Tell me about investment options",
          "Help me create a budget",
          "What is a tax-free savings account?",
          "Explain compound interest"
        ];
        
        const randomResult = simulatedResults[Math.floor(Math.random() * simulatedResults.length)];
        resolve(randomResult);
      }, 3000);
    });
  }

  /**
   * Prepare text for better speech synthesis
   */
  private prepareTextForSpeech(text: string): string {
    // Remove markdown formatting
    let cleanText = text.replace(/[#*_`]/g, '');
    
    // Replace common abbreviations with full words
    const replacements = {
      'R': 'Rand',
      'ZAR': 'South African Rand',
      'SARS': 'South African Revenue Service',
      'SARB': 'South African Reserve Bank',
      'JSE': 'Johannesburg Stock Exchange',
      'TFSA': 'Tax-Free Savings Account',
      'RA': 'Retirement Annuity',
      'AI': 'Artificial Intelligence',
      'ATM': 'Automated Teller Machine',
      'PIN': 'Personal Identification Number',
      'SMS': 'Short Message Service',
      'URL': 'web address',
      'CEO': 'Chief Executive Officer',
      'GDP': 'Gross Domestic Product',
      'VAT': 'Value Added Tax',
      '&': 'and',
      '%': 'percent',
      '@': 'at',
      'vs': 'versus',
      'etc': 'etcetera'
    };

    for (const [abbr, full] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      cleanText = cleanText.replace(regex, full);
    }

    // Add pauses for better speech flow
    cleanText = cleanText.replace(/\. /g, '. '); // Ensure space after periods
    cleanText = cleanText.replace(/[,;]/g, '$&, '); // Add slight pause after commas
    cleanText = cleanText.replace(/:/g, ':, '); // Add pause after colons
    
    // Break up long numbers for better pronunciation
    cleanText = cleanText.replace(/\b(\d{1,3})(\d{3})\b/g, '$1 thousand $2');
    cleanText = cleanText.replace(/\b(\d+)000000\b/g, '$1 million');
    
    return cleanText.trim();
  }

  /**
   * Load available voices from ElevenLabs
   */
  private async loadAvailableVoices(): Promise<void> {
    if (!this.elevenLabsApiKey) {
      console.log('No ElevenLabs API key, skipping voice loading');
      return;
    }

    try {
      const response = await fetch(`${this.elevenLabsBaseUrl}/voices`, {
        headers: {
          'xi-api-key': this.elevenLabsApiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.availableVoices = data.voices || [];
        console.log(`Loaded ${this.availableVoices.length} ElevenLabs voices`);
      }
    } catch (error) {
      console.error('Failed to load ElevenLabs voices:', error);
    }
  }

  /**
   * Get available voice personalities
   */
  getVoicePersonalities(): typeof this.voicePersonalities {
    return this.voicePersonalities;
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Check if voice service is enabled and available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.config.enabled;
  }

  /**
   * Generate speech for financial education
   */
  async speakFinancialTip(tip: string): Promise<void> {
    const introduction = "Here's a financial tip for you: ";
    const fullText = introduction + tip;
    await this.speak(fullText);
  }

  /**
   * Generate speech for AI responses
   */
  async speakAIResponse(response: string, isQuick: boolean = false): Promise<void> {
    if (isQuick) {
      // For quick responses, speak only key points
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const keyPoints = sentences.slice(0, 2).join('. ') + '.';
      await this.speak(keyPoints);
    } else {
      // For detailed responses, speak the full text
      await this.speak(response);
    }
  }

  /**
   * Generate contextual greetings
   */
  async speakGreeting(timeOfDay: 'morning' | 'afternoon' | 'evening'): Promise<void> {
    const greetings = {
      morning: "Good morning! I'm BlueBot, ready to help you start your day with smart financial decisions.",
      afternoon: "Good afternoon! How can I assist you with your finances today?",
      evening: "Good evening! Let's review your financial progress or plan for tomorrow."
    };

    await this.speak(greetings[timeOfDay]);
  }

  /**
   * Provide voice feedback for user actions
   */
  async speakActionFeedback(action: string, success: boolean): Promise<void> {
    const feedback = success 
      ? `Great job! Your ${action} has been completed successfully.`
      : `There was an issue with your ${action}. Please try again.`;
    
    await this.speak(feedback);
  }
}

export default new VoiceInteractionService();
export type { VoiceConfig, SpeechOptions };
