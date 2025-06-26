import React, { useState } from 'react';
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
  User,
  Bot,
  Check
} from 'lucide-react-native';

export default function RegisterScreen() {
  const { signUp, signUpWithPhone } = useAuth();
  const [registrationMethod, setRegistrationMethod] = useState<'phone' | 'email'>('phone');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (registrationMethod === 'phone') {
      if (!phoneNumber.trim()) {
        Alert.alert('Error', 'Please enter your phone number');
        return false;
      }
      if (phoneNumber.length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return false;
      }
    } else {
      if (!email.trim()) {
        Alert.alert('Error', 'Please enter your email address');
        return false;
      }
      if (!email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
      if (!password.trim()) {
        Alert.alert('Error', 'Please enter a password');
        return false;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      if (registrationMethod === 'phone') {
        // Format phone number for South Africa
        const formattedPhone = phoneNumber.startsWith('+27') 
          ? phoneNumber 
          : `+27${phoneNumber.replace(/^0/, '')}`;
        
        await signUpWithPhone(formattedPhone, fullName);
        router.push('/(auth)/verify-otp');
      } else {
        await signUp(email, password, fullName);
        router.push('/onboarding');
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
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
            <Text style={styles.title}>Join BlueBot</Text>
            <Text style={styles.subtitle}>Start your financial journey today</Text>
          </View>

          {/* Registration Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                registrationMethod === 'phone' && styles.toggleButtonActive
              ]}
              onPress={() => setRegistrationMethod('phone')}
            >
              <Phone size={20} color={registrationMethod === 'phone' ? '#ffffff' : '#002d72'} />
              <Text style={[
                styles.toggleText,
                registrationMethod === 'phone' && styles.toggleTextActive
              ]}>
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                registrationMethod === 'email' && styles.toggleButtonActive
              ]}
              onPress={() => setRegistrationMethod('email')}
            >
              <Mail size={20} color={registrationMethod === 'email' ? '#ffffff' : '#002d72'} />
              <Text style={[
                styles.toggleText,
                registrationMethod === 'email' && styles.toggleTextActive
              ]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            {registrationMethod === 'phone' ? (
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
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
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
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Check size={16} color="#ffffff" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the{' '}
                <Link href="/privacy-policy" asChild>
                  <Text style={styles.link}>Terms & Conditions</Text>
                </Link>
                {' '}and{' '}
                <Link href="/privacy-policy" asChild>
                  <Text style={styles.link}>Privacy Policy</Text>
                </Link>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#002d72', '#0066cc']}
                style={styles.registerButtonGradient}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why choose BlueBot?</Text>
            <View style={styles.benefitItem}>
              <Check size={16} color="#10b981" />
              <Text style={styles.benefitText}>AI-powered financial coaching</Text>
            </View>
            <View style={styles.benefitItem}>
              <Check size={16} color="#10b981" />
              <Text style={styles.benefitText}>Smart expense tracking</Text>
            </View>
            <View style={styles.benefitItem}>
              <Check size={16} color="#10b981" />
              <Text style={styles.benefitText}>Digital wallet for everyone</Text>
            </View>
            <View style={styles.benefitItem}>
              <Check size={16} color="#10b981" />
              <Text style={styles.benefitText}>Community banking & stokvels</Text>
            </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#002d72',
    borderColor: '#002d72',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  link: {
    color: '#0066cc',
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signinText: {
    fontSize: 14,
    color: '#666',
  },
  signinLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  benefitsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002d72',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
});