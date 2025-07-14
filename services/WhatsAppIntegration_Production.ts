/**
 * Production-Ready WhatsApp Integration Service
 * Comprehensive WhatsApp Business API integration with message handling,
 * webhook management, template support, and media handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageType: 'text' | 'template' | 'interactive' | 'media';
}

export interface WhatsAppContact {
  phone: string;
  name?: string;
  profilePictureUrl?: string;
  lastSeen?: Date;
  isBlocked?: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: 'marketing' | 'utility' | 'authentication';
  components: WhatsAppTemplateComponent[];
  status: 'approved' | 'pending' | 'rejected';
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  text?: string;
  parameters?: string[];
}

export interface WhatsAppWebhook {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppMessageStatus[];
  };
  field: string;
}

export interface WhatsAppMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

interface BusinessProfile {
  messaging_product: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

class ProductionWhatsAppService {
  private accessToken: string = '';
  private phoneNumberId: string = '';
  private businessAccountId: string = '';
  private webhookUrl: string = '';
  private webhookVerifyToken: string = '';
  private apiVersion: string = 'v18.0';
  private baseUrl: string = 'https://graph.facebook.com';
  
  private messageQueue: WhatsAppMessage[] = [];
  private isInitialized = false;
  private contacts: Map<string, WhatsAppContact> = new Map();
  private templates: Map<string, WhatsAppTemplate> = new Map();
  private messageHandlers: Array<(message: WhatsAppMessage) => void> = [];
  private statusHandlers: Array<(status: WhatsAppMessageStatus) => void> = [];
  
  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load WhatsApp Business API configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      this.accessToken = process.env.EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN || '';
      this.phoneNumberId = process.env.EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '';
      this.businessAccountId = process.env.EXPO_PUBLIC_WHATSAPP_BUSINESS_ACCOUNT_ID || '';
      this.webhookUrl = process.env.EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL || '';
      this.webhookVerifyToken = process.env.EXPO_PUBLIC_WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';

      // Load cached data
      await this.loadCachedData();
      
      console.log('WhatsApp configuration loaded');
    } catch (error) {
      console.error('Failed to load WhatsApp configuration:', error);
    }
  }

  /**
   * Initialize WhatsApp Business API connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API credentials not configured');
      }

      // Verify phone number and get business profile
      await this.verifyPhoneNumber();
      
      // Load message templates
      await this.loadTemplates();
      
      // Set up webhook if configured
      if (this.webhookUrl) {
        await this.setupWebhook();
      }

      this.isInitialized = true;
      console.log('WhatsApp Business API initialized successfully');
    } catch (error) {
      console.error('WhatsApp initialization failed:', error);
      throw new Error(`WhatsApp initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify phone number and get business profile
   */
  private async verifyPhoneNumber(): Promise<BusinessProfile> {
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Phone number verification failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Phone number verified:', data.display_phone_number);
    
    return data;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessage> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const message: WhatsAppMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.phoneNumberId,
      to: this.formatPhoneNumber(to),
      text,
      timestamp: new Date(),
      status: 'sending',
      messageType: 'text'
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: message.to,
            type: 'text',
            text: { body: text }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Message send failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      message.id = data.messages[0].id;
      message.status = 'sent';

      // Store message
      await this.storeMessage(message);

      console.log('Text message sent successfully:', message.id);
      return message;
    } catch (error) {
      message.status = 'failed';
      await this.storeMessage(message);
      
      console.error('Failed to send text message:', error);
      throw error;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'en',
    parameters: string[] = []
  ): Promise<WhatsAppMessage> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const message: WhatsAppMessage = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.phoneNumberId,
      to: this.formatPhoneNumber(to),
      timestamp: new Date(),
      status: 'sending',
      messageType: 'template'
    };

    try {
      const templateBody: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode }
        }
      };

      // Add parameters if provided
      if (parameters.length > 0) {
        templateBody.template.components = [{
          type: 'body',
          parameters: parameters.map(param => ({ type: 'text', text: param }))
        }];
      }

      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(templateBody)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Template message send failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      message.id = data.messages[0].id;
      message.status = 'sent';

      await this.storeMessage(message);

      console.log('Template message sent successfully:', message.id);
      return message;
    } catch (error) {
      message.status = 'failed';
      await this.storeMessage(message);
      
      console.error('Failed to send template message:', error);
      throw error;
    }
  }

  /**
   * Send media message
   */
  async sendMediaMessage(
    to: string, 
    mediaUrl: string, 
    mediaType: 'image' | 'video' | 'audio' | 'document',
    caption?: string
  ): Promise<WhatsAppMessage> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const message: WhatsAppMessage = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.phoneNumberId,
      to: this.formatPhoneNumber(to),
      mediaUrl,
      mediaType,
      text: caption,
      timestamp: new Date(),
      status: 'sending',
      messageType: 'media'
    };

    try {
      const mediaBody: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        type: mediaType,
        [mediaType]: { link: mediaUrl }
      };

      if (caption && (mediaType === 'image' || mediaType === 'video')) {
        mediaBody[mediaType].caption = caption;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaBody)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Media message send failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      message.id = data.messages[0].id;
      message.status = 'sent';

      await this.storeMessage(message);

      console.log('Media message sent successfully:', message.id);
      return message;
    } catch (error) {
      message.status = 'failed';
      await this.storeMessage(message);
      
      console.error('Failed to send media message:', error);
      throw error;
    }
  }

  /**
   * Send interactive button message
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string
  ): Promise<WhatsAppMessage> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const message: WhatsAppMessage = {
      id: `interactive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.phoneNumberId,
      to: this.formatPhoneNumber(to),
      text: bodyText,
      timestamp: new Date(),
      status: 'sending',
      messageType: 'interactive'
    };

    try {
      const interactiveBody: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        }
      };

      if (headerText) {
        interactiveBody.interactive.header = {
          type: 'text',
          text: headerText
        };
      }

      if (footerText) {
        interactiveBody.interactive.footer = {
          text: footerText
        };
      }

      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(interactiveBody)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Interactive message send failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      message.id = data.messages[0].id;
      message.status = 'sent';

      await this.storeMessage(message);

      console.log('Interactive message sent successfully:', message.id);
      return message;
    } catch (error) {
      message.status = 'failed';
      await this.storeMessage(message);
      
      console.error('Failed to send interactive message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(webhookData: WhatsAppWebhook): Promise<void> {
    try {
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            // Handle incoming messages
            if (change.value.messages) {
              for (const message of change.value.messages) {
                await this.handleIncomingMessage(message);
              }
            }

            // Handle message status updates
            if (change.value.statuses) {
              for (const status of change.value.statuses) {
                await this.handleMessageStatus(status);
              }
            }

            // Handle contact updates
            if (change.value.contacts) {
              for (const contact of change.value.contacts) {
                await this.handleContactUpdate(contact);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(messageData: any): Promise<void> {
    const message: WhatsAppMessage = {
      id: messageData.id,
      from: messageData.from,
      to: this.phoneNumberId,
      text: messageData.text?.body || '',
      mediaUrl: messageData.image?.link || messageData.video?.link || messageData.audio?.link || messageData.document?.link,
      mediaType: messageData.type !== 'text' ? messageData.type : undefined,
      timestamp: new Date(parseInt(messageData.timestamp) * 1000),
      status: 'delivered',
      messageType: messageData.type
    };

    // Store incoming message
    await this.storeMessage(message);

    // Notify message handlers
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    }

    // Mark message as read
    await this.markMessageAsRead(message.id);

    console.log('Incoming message handled:', message.id);
  }

  /**
   * Handle message status update
   */
  private async handleMessageStatus(statusData: WhatsAppMessageStatus): Promise<void> {
    // Update stored message status
    await this.updateMessageStatus(statusData.id, statusData.status);

    // Notify status handlers
    for (const handler of this.statusHandlers) {
      try {
        handler(statusData);
      } catch (error) {
        console.error('Status handler error:', error);
      }
    }

    console.log('Message status updated:', statusData.id, statusData.status);
  }

  /**
   * Handle contact update
   */
  private async handleContactUpdate(contactData: WhatsAppContact): Promise<void> {
    this.contacts.set(contactData.phone, contactData);
    await this.storeContact(contactData);
    console.log('Contact updated:', contactData.phone);
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
          })
        }
      );

      if (!response.ok) {
        console.warn('Failed to mark message as read:', response.statusText);
      }
    } catch (error) {
      console.warn('Mark as read error:', error);
    }
  }

  /**
   * Load message templates
   */
  private async loadTemplates(): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn('Failed to load templates:', response.statusText);
        return;
      }

      const data = await response.json();
      
      for (const template of data.data || []) {
        this.templates.set(template.name, {
          id: template.id,
          name: template.name,
          language: template.language,
          category: template.category,
          components: template.components || [],
          status: template.status
        });
      }

      console.log('Loaded', this.templates.size, 'message templates');
    } catch (error) {
      console.warn('Template loading error:', error);
    }
  }

  /**
   * Setup webhook subscription
   */
  private async setupWebhook(): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.apiVersion}/${this.businessAccountId}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscribed_fields: ['messages', 'message_deliveries', 'message_reads', 'message_echoes']
          })
        }
      );

      if (!response.ok) {
        console.warn('Webhook setup failed:', response.statusText);
      } else {
        console.log('Webhook subscription configured');
      }
    } catch (error) {
      console.warn('Webhook setup error:', error);
    }
  }

  /**
   * Format phone number to WhatsApp format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming South Africa +27)
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return '27' + cleaned.substring(1);
    }
    
    if (cleaned.length === 9) {
      return '27' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Store message locally
   */
  private async storeMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const messages = await this.getStoredMessages();
      messages.push(message);
      
      // Keep only last 1000 messages
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }
      
      await AsyncStorage.setItem('whatsapp_messages', JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to store message:', error);
    }
  }

  /**
   * Store contact locally
   */
  private async storeContact(contact: WhatsAppContact): Promise<void> {
    try {
      const contacts = await this.getStoredContacts();
      const existingIndex = contacts.findIndex(c => c.phone === contact.phone);
      
      if (existingIndex >= 0) {
        contacts[existingIndex] = contact;
      } else {
        contacts.push(contact);
      }
      
      await AsyncStorage.setItem('whatsapp_contacts', JSON.stringify(contacts));
    } catch (error) {
      console.warn('Failed to store contact:', error);
    }
  }

  /**
   * Update message status
   */
  private async updateMessageStatus(messageId: string, status: string): Promise<void> {
    try {
      const messages = await this.getStoredMessages();
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      if (messageIndex >= 0) {
        messages[messageIndex].status = status as any;
        await AsyncStorage.setItem('whatsapp_messages', JSON.stringify(messages));
      }
    } catch (error) {
      console.warn('Failed to update message status:', error);
    }
  }

  /**
   * Get stored messages
   */
  async getStoredMessages(): Promise<WhatsAppMessage[]> {
    try {
      const stored = await AsyncStorage.getItem('whatsapp_messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get stored contacts
   */
  async getStoredContacts(): Promise<WhatsAppContact[]> {
    try {
      const stored = await AsyncStorage.getItem('whatsapp_contacts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Load cached data
   */
  private async loadCachedData(): Promise<void> {
    try {
      const [messages, contacts] = await Promise.all([
        this.getStoredMessages(),
        this.getStoredContacts()
      ]);

      // Load contacts into memory
      for (const contact of contacts) {
        this.contacts.set(contact.phone, contact);
      }

      console.log('Cached data loaded:', messages.length, 'messages,', contacts.length, 'contacts');
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: (message: WhatsAppMessage) => void): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index >= 0) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register status handler
   */
  onStatus(handler: (status: WhatsAppMessageStatus) => void): () => void {
    this.statusHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index >= 0) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Open WhatsApp app with pre-filled message
   */
  async openWhatsApp(phone: string, message?: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const encodedMessage = message ? encodeURIComponent(message) : '';
      const url = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Get available templates
   */
  getTemplates(): WhatsAppTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get contacts
   */
  getContacts(): WhatsAppContact[] {
    return Array.from(this.contacts.values());
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasCredentials: !!(this.accessToken && this.phoneNumberId),
      templateCount: this.templates.size,
      contactCount: this.contacts.size,
      messageHandlers: this.messageHandlers.length,
      statusHandlers: this.statusHandlers.length
    };
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['whatsapp_messages', 'whatsapp_contacts']);
      this.contacts.clear();
      this.templates.clear();
      this.messageQueue = [];
      console.log('WhatsApp data cleared');
    } catch (error) {
      console.warn('Failed to clear WhatsApp data:', error);
    }
  }
}

export default new ProductionWhatsAppService();
