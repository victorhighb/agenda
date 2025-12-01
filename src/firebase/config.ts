// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Carregue as variáveis via process.env (configure com react-native-dotenv ou outra solução)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY ?? "<FIREBASE_API_KEY>",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "<PROJECT_ID>.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID ?? "<PROJECT_ID>",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "<PROJECT_ID>.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? "<SENDER_ID>",
  appId: process.env.FIREBASE_APP_ID ?? "<APP_ID>",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;