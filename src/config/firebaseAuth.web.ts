import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/config/firebase';

export const firebaseAuth = getAuth(firebaseApp);
