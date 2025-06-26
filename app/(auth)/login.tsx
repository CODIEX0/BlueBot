import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  Lock, 
  Fingerprint,
  Bot
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LoginScreen() {
  const { signIn, signInWithPhone } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.log('Biometric check error:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Biometric authentication is not available on web');
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to BlueBot',
        fallbackLabel: 'Use password',
      });

      if (result.success) {
        // Simulate successful biometric login
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      if (loginMethod === 'phone') {
        if (!phoneNumber.trim()) {
          Alert.alert('Error', 'Please enter your phone number');
          return;
        }
        
        // Format phone number for South Africa
        const formattedPhone = phoneNumber.startsWith('+27') 
          ? phoneNumber 
          : `+27${phoneNumber.replace(/^0/, '')}`;
        
        await signInWithPhone(formattedPhone);
        router.push('/(auth)/verify-otp');
      } else {
        if (!email.trim() || !password.trim()) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        
        await signIn(email, password);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#002d72', '#0066cc']}
              style={styles.logoContainer}
            >
              <Bot size={48} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.title}>Welcome to BlueBot</Text>
            <Text style={styles.subtitle}>Your AI Financial Assistant</Text>
          </View>

          {/* Login Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'phone' && styles.toggleButtonActive
              ]}
              onPress={() => setLoginMethod('phone')}
            >
              <Phone size={20} color={loginMethod === 'phone' ? '#ffffff' : '#002d72'} />
              <Text style={[
                styles.toggleText,
                loginMethod === 'phone' && styles.toggleTextActive
              ]}>
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === 'email' && styles.toggleButtonActive
              ]}
              onPress={() => setLoginMethod('email')}
            >
              <Mail size={20} color={loginMethod === 'email' ? '#ffffff' : '#002d72'} />
              <Text style={[
                styles.toggleText,
                loginMethod === 'email' && styles.toggleTextActive
              ]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {loginMethod === 'phone' ? (
              <View style={styles.inputContainer}>
                <Phone size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (e.g., 0712345678)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            ) : (
              <>
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
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#002d72', '#0066cc']}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {loginMethod === 'email' && (
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>

          {/* Biometric Login */}
          {biometricAvailable && (
            <View style={styles.biometricContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Fingerprint size={24} color="#002d72" />
                <Text style={styles.biometricText}>Use Biometric Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Privacy Policy */}
          <View style={styles.privacyContainer}>
            <Text style={styles.privacyText}>
              By signing in, you agree to our{' '}
            </Text>
            <Link href="/privacy-policy" asChild>
              <TouchableOpacity>
                <Text style={styles.privacyLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e6eff6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#002d72',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#002d72',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  form: {
    gap: 16,
    marginBottom: 24,
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
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  biometricContainer: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#002d72',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  privacyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  privacyLink: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
});