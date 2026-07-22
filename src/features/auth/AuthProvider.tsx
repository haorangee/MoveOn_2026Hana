import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { firebaseAuth } from '@/config/firebaseAuth';
import {
  createEmailAccount,
  signInWithFirebaseCustomToken,
  signInWithEmail,
  signOutCurrentUser,
} from '@/shared/backend/authRepository';

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  isRegistered: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithCustomToken: (customToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [isRegistered, setIsRegistered] = useState(
    Boolean(firebaseAuth.currentUser && !firebaseAuth.currentUser.isAnonymous),
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setIsRegistered(Boolean(nextUser && !nextUser.isAnonymous));
    setIsReady(true);
  }), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await signInWithEmail(email, password);
    setUser(nextUser);
    setIsRegistered(true);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const nextUser = await createEmailAccount(email, password);
    setUser(nextUser);
    setIsRegistered(true);
  }, []);

  const handleCustomTokenSignIn = useCallback(async (customToken: string) => {
    const nextUser = await signInWithFirebaseCustomToken(customToken);
    setUser(nextUser);
    setIsRegistered(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutCurrentUser();
    setUser(null);
    setIsRegistered(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isReady,
    isRegistered,
    signIn,
    signUp,
    signInWithCustomToken: handleCustomTokenSignIn,
    signOut: handleSignOut,
  }), [handleCustomTokenSignIn, handleSignOut, isReady, isRegistered, signIn, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
