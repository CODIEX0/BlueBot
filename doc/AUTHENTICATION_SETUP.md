# BlueBot Advanced Authentication Setup

This guide will help you set up the advanced authentication features in your BlueBot app.

## Prerequisites

Before using the advanced authentication features, you'll need to set up:

1. **Firebase Project**
2. **Google Sign-In Configuration**
3. **reCAPTCHA Configuration**
4. **Deep Links for Passwordless Authentication**

## Firebase Configuration

### 1. Firebase Auth Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication
4. Configure sign-in methods:
   - Email/Password
   - Phone
   - Google
   - Email Link (Passwordless)

### 2. Enable Sign-In Methods

In Firebase Console > Authentication > Sign-in method:
- ✅ Email/Password
- ✅ Phone
- ✅ Google
- ✅ Email Link (passwordless sign-in)

## Google Sign-In Setup

### 1. Get Google Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Get your Web Client ID
4. Update in `contexts/AuthContext.tsx`:

```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_ACTUAL_GOOGLE_WEB_CLIENT_ID', // Replace this
  offlineAccess: true,
});
```

### 2. Platform-specific Setup

#### Android
1. Add SHA-1 fingerprint to Firebase project
2. Download and add `google-services.json`

#### iOS
1. Add URL scheme to Info.plist
2. Download and add `GoogleService-Info.plist`

## reCAPTCHA Setup

### 1. Get reCAPTCHA Site Key

1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Get your site key
4. Update in `components/RecaptchaComponent.tsx`:

```typescript
siteKey = 'YOUR_ACTUAL_RECAPTCHA_SITE_KEY' // Replace this
baseUrl = 'https://yourdomain.com' // Replace with your domain
```

## Passwordless Authentication Setup

### 1. Configure Dynamic Links

1. In Firebase Console, go to Dynamic Links
2. Set up your domain (e.g., `yourapp.page.link`)
3. Update in `contexts/AuthContext.tsx`:

```typescript
const actionCodeSettings = {
  url: 'https://yourapp.page.link/finishSignUp', // Replace
  handleCodeInApp: true,
  iOS: {
    bundleId: 'com.yourapp.bluebot' // Replace with your bundle ID
  },
  android: {
    packageName: 'com.yourapp.bluebot', // Replace with your package name
    installApp: true,
    minimumVersion: '12'
  },
  dynamicLinkDomain: 'yourapp.page.link' // Replace
};
```

### 2. Handle Deep Links

Configure your app to handle the passwordless sign-in links when they're opened.

## Biometric Authentication

The biometric authentication uses Expo's Local Authentication. It's already configured and will automatically detect available biometric methods on the device.

### Supported Methods
- ✅ Fingerprint (Touch ID)
- ✅ Face Recognition (Face ID)
- ✅ Iris Scanning
- ✅ Device Passcode

## Phone Authentication with reCAPTCHA

For production use, configure Firebase Phone Auth:

1. Enable Phone authentication in Firebase Console
2. Set up your app verification:
   - Android: SHA-256 fingerprints
   - iOS: APNs certificates
3. Configure reCAPTCHA for web testing

## Security Features Included

### ✅ Multi-Factor Authentication
- Email/Password + reCAPTCHA
- Phone + reCAPTCHA verification
- Biometric authentication
- Google OAuth

### ✅ Advanced Security
- Password strength validation
- Account verification status
- Last login method tracking
- Secure credential storage
- reCAPTCHA anti-bot protection

### ✅ User Experience
- Passwordless email sign-in
- Quick biometric access
- Social sign-in options
- Progressive security setup

## Usage Examples

### Traditional Sign-In
```typescript
await signIn(email, password);
```

### Passwordless Sign-In
```typescript
// Send link
await signInPasswordless(email);
// Complete sign-in (when link is clicked)
await completePasswordlessSignIn(email, emailLink);
```

### Google Sign-In
```typescript
await signInWithGoogle();
```

### Biometric Sign-In
```typescript
await signInWithBiometric();
```

### Enable Biometric for User
```typescript
await enableBiometric();
```

## Files Modified/Created

### Enhanced Authentication Context
- `contexts/AuthContext.tsx` - Core authentication logic with all methods

### New Authentication Screens
- `app/(auth)/enhanced-login.tsx` - Multi-method login screen
- `app/(auth)/enhanced-register.tsx` - Registration with security options
- `app/(auth)/verify-otp.tsx` - Updated with reCAPTCHA

### New Components
- `components/RecaptchaComponent.tsx` - reCAPTCHA verification
- `components/BiometricSettings.tsx` - Biometric management
- `app/(tabs)/profile.tsx` - Updated profile with security settings

## Testing the Features

1. **Traditional Auth**: Use the enhanced login/register screens
2. **Google Sign-In**: Configure OAuth and test social login
3. **Biometric**: Enable in profile settings (requires physical device)
4. **reCAPTCHA**: Test phone verification with reCAPTCHA
5. **Passwordless**: Configure dynamic links and test email links

## Security Notes

- Biometric data never leaves the device
- reCAPTCHA protects against automated attacks
- All authentication methods are properly validated
- User preferences are stored securely
- Last login method tracking for security monitoring

## Troubleshooting

### Common Issues

1. **Google Sign-In fails**: Check client ID configuration
2. **reCAPTCHA not loading**: Verify site key and domain
3. **Biometric not available**: Check device capabilities
4. **Deep links not working**: Verify dynamic link configuration
5. **Phone auth issues**: Check Firebase project setup

### Debug Tips

- Check console logs for authentication errors
- Verify all configuration keys are set
- Test on physical devices for biometric features
- Use Firebase Auth emulator for development

Remember to replace all placeholder values with your actual configuration before deploying to production!
