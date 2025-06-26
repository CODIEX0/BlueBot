import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, ArrowLeft, Mail } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.logoContainer}
            >
              <Mail size={48} color="#ffffff" />
            </LinearGradient>
            
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent password reset instructions to {email}
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>What's next?</Text>
            <Text style={styles.instructionsText}>
              1. Check your email inbox (and spam folder)
            </Text>
            <Text style={styles.instructionsText}>
              2. Click the reset link in the email
            </Text>
            <Text style={styles.instructionsText}>
              3. Create a new password
            </Text>
            <Text style={styles.instructionsText}>
              4. Sign in with your new password
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.resendText}>Didn't receive the email?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#002d72" />
          </TouchableOpacity>
          
          <LinearGradient
            colors={['#002d72', '#0066cc']}
            style={styles.logoContainer}
          >
            <Bot size={48} color="#ffffff" />
          </LinearGradient>
          
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <LinearGradient
              colors={['#002d72', '#0066cc']}
              style={styles.resetButtonGradient}
            >
              <Text style={styles.resetButtonText}>
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            If you don't receive an email within a few minutes, check your spam folder or try again.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#002d72',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#002d72',
  },
  resetButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002d72',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  backToLoginButton: {
    backgroundColor: '#002d72',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
});