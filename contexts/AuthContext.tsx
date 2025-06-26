import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
  photoURL?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  walletId?: string;
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
    verificationId?: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              phoneNumber: firebaseUser.phoneNumber || undefined,
              fullName: userData.fullName || firebaseUser.displayName || 'User',
              isVerified: firebaseUser.emailVerified,
              createdAt: userData.createdAt || new Date().toISOString(),
              photoURL: firebaseUser.photoURL || undefined,
              kycStatus: userData.kycStatus || 'pending',
              walletId: userData.walletId,
            };
            setUser(user);
          } else {
            // Create user document in Firestore if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              phoneNumber: firebaseUser.phoneNumber || undefined,
              fullName: firebaseUser.displayName || 'User',
              isVerified: firebaseUser.emailVerified,
              createdAt: new Date().toISOString(),
              photoURL: firebaseUser.photoURL || undefined,
              kycStatus: 'pending',
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              fullName: newUser.fullName,
              email: newUser.email,
              phoneNumber: newUser.phoneNumber,
              isVerified: newUser.isVerified,
              createdAt: newUser.createdAt,
              kycStatus: newUser.kycStatus,
            });
            
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated through onAuthStateChanged
    } catch (error: any) {
      let errorMessage = 'Sign in failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        default:
          errorMessage = error.message || 'Sign in failed';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateFirebaseProfile(userCredential.user, {
        displayName: fullName
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName,
        email,
        isVerified: userCredential.user.emailVerified,
        createdAt: new Date().toISOString(),
        kycStatus: 'pending',
      });
      
      // User state will be updated through onAuthStateChanged
    } catch (error: any) {
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        default:
          errorMessage = error.message || 'Registration failed';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      // Note: Phone auth requires additional setup with Firebase
      // For demo purposes, we'll simulate the process
      setPendingPhoneAuth({
        phoneNumber,
        isSignUp: false,
        verificationId: 'mock_verification_id',
      });
      
      console.log('SMS verification code sent to:', phoneNumber);
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  };

  const signUpWithPhone = async (phoneNumber: string, fullName: string) => {
    try {
      // Note: Phone auth requires additional setup with Firebase
      // For demo purposes, we'll simulate the process
      setPendingPhoneAuth({
        phoneNumber,
        fullName,
        isSignUp: true,
        verificationId: 'mock_verification_id',
      });
      
      console.log('SMS verification code sent to:', phoneNumber);
    } catch (error) {
      throw new Error('Failed to send verification code');
    }
  };

  const verifyOTP = async (otp: string) => {
    if (!pendingPhoneAuth) {
      throw new Error('No pending phone authentication');
    }

    try {
      // In a real implementation, you would use:
      // const credential = PhoneAuthProvider.credential(pendingPhoneAuth.verificationId, otp);
      // const userCredential = await signInWithCredential(auth, credential);
      
      // For demo purposes, we'll simulate successful verification
      if (otp.length === 6) {
        console.log('Phone number verified successfully');
        setPendingPhoneAuth(null);
      } else {
        throw new Error('Invalid verification code');
      }
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
      console.log('Verification code resent to:', pendingPhoneAuth.phoneNumber);
    } catch (error) {
      throw new Error('Failed to resend verification code');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setPendingPhoneAuth(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user signed in');

    try {
      // Update Firestore document
      await updateDoc(doc(db, 'users', user.id), updates);
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
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