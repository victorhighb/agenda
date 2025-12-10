# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure Firebase

   Copy the Firebase configuration example file and add your Firebase credentials:

   ```bash
   cp src/config/firebase.example.ts src/config/firebase.ts
   ```

   Then edit `src/config/firebase.ts` and replace the placeholder values with your actual Firebase project configuration.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Features

### Account Switching

The app includes an account switching feature that allows users to:

- Save multiple account credentials securely using `expo-secure-store`
- Quickly switch between saved accounts without re-entering credentials
- Add new accounts from the profile screen
- Remove saved accounts from the list

**How to use:**

1. Go to the Profile tab
2. Tap "Trocar de conta" (Switch Account)
3. Add a new account by entering email and password, or select from saved accounts
4. Tap on any saved account to switch to it automatically

**Security Note:** Account credentials are stored locally using `expo-secure-store`, which provides hardware-backed encryption on supported devices. The feature is designed for convenience on personal devices.
