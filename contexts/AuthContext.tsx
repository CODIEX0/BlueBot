import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  signUpWithPhone: (phoneNumber: string, fullName: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  resendOTP: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPhoneAuth, setPendingPhoneAuth] = useState<{
    phoneNumber: string;
    fullName?: string;
    isSignUp: boolean;
  } | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('authToken');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const storeAuth = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing auth:', error);
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'authToken']);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const userData: User = {
        id: 'user_' + Date.now(),
        email,
        fullName: 'John Doe', // In real app, this would come from API
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      
      const token = 'mock_token_' + Date.now();
      
      await storeAuth(userData, token);
      setUser(userData);
    } catch (error) {
      throw new Error('Invalid email or password');
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const userData: User = {
        id: 'user_' + Date.now(),
        email,
        fullName,
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      
      const token = 'mock_token_' + Date.now();
      
      await storeAuth(userData, token);
      setUser(userData);
    } catch (error) {
      throw new Error('Registration failed. Please try again.');
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingPhoneAuth({
        phoneNumber,
        isSignUp: false,
      });
      
      // In real app, OTP would be sent via SMS
      console.log('OTP sent to:', phoneNumber);
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  };

  const signUpWithPhone = async (phoneNumber: string, fullName: string) => {
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingPhoneAuth({
        phoneNumber,
        fullName,
        isSignUp: true,
      });
      
      // In real app, OTP would be sent via SMS
      console.log('OTP sent to:', phoneNumber);
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  };

  const verifyOTP = async (otp: string) => {
    if (!pendingPhoneAuth) {
      throw new Error('No pending phone authentication');
    }

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock OTP verification (accept any 6-digit code)
      if (otp.length !== 6) {
        throw new Error('Invalid verification code');
      }
      
      const userData: User = {
        id: 'user_' + Date.now(),
        phoneNumber: pendingPhoneAuth.phoneNumber,
        fullName: pendingPhoneAuth.fullName || 'Phone User',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      
      const token = 'mock_token_' + Date.now();
      
      await storeAuth(userData, token);
      setUser(userData);
      setPendingPhoneAuth(null);
    } catch (error) {
      throw new Error('Invalid verification code');
    }
  };

  const resendOTP = async () => {
    if (!pendingPhoneAuth) {
      throw new Error('No pending phone authentication');
    }

    try {
      // Simulate resending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('OTP resent to:', pendingPhoneAuth.phoneNumber);
    } catch (error) {
      throw new Error('Failed to resend verification code');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Simulate sending reset email
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password reset email sent to:', email);
    } catch (error) {
      throw new Error('Failed to send reset email');
    }
  };

  const signOut = async () => {
    try {
      await clearAuth();
      setUser(null);
      setPendingPhoneAuth(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      await storeAuth(updatedUser, 'current_token'); // In real app, get current token
      setUser(updatedUser);
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithPhone,
    signUpWithPhone,
    verifyOTP,
    resendOTP,
    resetPassword,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}