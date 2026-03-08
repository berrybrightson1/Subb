import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);

    // Enable AsyncStorage-backed session persistence on native only
    let persistence: any = undefined;
    if (Platform.OS !== 'web') {
        try {
            const { getReactNativePersistence } = require('firebase/auth');
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            persistence = getReactNativePersistence(AsyncStorage);
        } catch { /* ignore — persistence will fall back to memory */ }
    }

    if (persistence) {
        auth = initializeAuth(app, { persistence });
    } else {
        auth = getAuth(app);
    }
} else {
    app = getApp();
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
