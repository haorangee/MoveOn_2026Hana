import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = [
  ['EXPO_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['EXPO_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
] as const;

const missingConfig = requiredConfig
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  throw new Error(`Firebase 환경 변수가 없습니다: ${missingConfig.join(', ')}`);
}

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);
