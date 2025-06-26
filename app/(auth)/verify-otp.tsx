import React, { useState, useEffect, useRef } from 'react';
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
import { Bot, ArrowLeft } from 'lucide-react-native';

export default function VerifyOTPScreen() {
  const { verifyOTP, resendOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    
    try {
      await verifyOTP(code);
      router.replace('/onboarding');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid code. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    
    try {
      await resendOTP();
      setCountdown(60);
      Alert.alert('Success', 'A new verification code has been sent');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

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
          
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to your phone number
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                loading && styles.otpInputDisabled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (loading || otp.some(digit => !digit)) && styles.verifyButtonDisabled
          ]}
          onPress={() => handleVerifyOTP()}
          disabled={loading || otp.some(digit => !digit)}
        >
          <LinearGradient
            colors={['#002d72', '#0066cc']}
            style={styles.verifyButtonGradient}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Resend in {countdown}s
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={resendLoading}
            >
              <Text style={styles.resendLink}>
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Having trouble? Make sure your phone number is correct and you have network coverage.
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
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#002d72',
  },
  otpInputFilled: {
    borderColor: '#002d72',
    backgroundColor: '#f0f7ff',
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  verifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  countdownText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resendLink: {
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
});