# Firebase Configuration

This file explains how to configure Firebase for the Agenda app.

## Setup Instructions

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)

2. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider

3. **Create Firestore Database**:
   - Go to Firestore Database
   - Create database (start in production mode or test mode)
   - Set up the following collections:
     - `users`: Stores user profile information
     - `clients`: Stores client information
     - `schedules`: Stores scheduling information

4. **Get your Firebase config**:
   - Go to Project Settings (gear icon)
   - Under "Your apps", select or add a web app
   - Copy the Firebase configuration

5. **Create firebase.ts file**:
   ```bash
   cp src/config/firebase.example.ts src/config/firebase.ts
   ```

6. **Update firebase.ts** with your actual Firebase configuration values

7. **Or use environment variables** (recommended):
   - Create a `.env` file in the project root:
     ```
     EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
     EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

## Security Note

⚠️ **IMPORTANT**: Never commit your actual `firebase.ts` file with real credentials to version control. The file is already in `.gitignore` to prevent accidental commits.

## Firestore Security Rules

For production, update your Firestore security rules to ensure data privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow listing all users for account switching (if needed)
      allow list: if request.auth != null;
    }
    
    // Clients belong to specific users
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
    }
    
    // Schedules belong to specific users
    match /schedules/{scheduleId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
    }
  }
}
```

## Account Switching Feature

The app now supports switching between accounts without re-entering passwords:

- When users log in or register, their credentials are securely stored using Expo SecureStore
- Users can view all available accounts and switch between them from the Profile screen
- The "Trocar de conta" (Switch account) button shows a list of all registered users
- Switching is seamless and doesn't require password re-entry

**Note**: This feature uses device-level secure storage, so credentials are only available on the device where the user first logged in.
