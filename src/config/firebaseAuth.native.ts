import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from '@firebase/auth';
import type { Persistence } from 'firebase/auth';
import { firebaseApp } from '@/config/firebase';

type ReactNativeAuthModule = typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

const { getReactNativePersistence } = FirebaseAuth as ReactNativeAuthModule;

function createPersistentAuth() {
  try {
    return FirebaseAuth.initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return FirebaseAuth.getAuth(firebaseApp);
  }
}

export const firebaseAuth = createPersistentAuth();
