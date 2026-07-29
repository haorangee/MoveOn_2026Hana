import { getFunctions } from 'firebase/functions';
import { firebaseApp } from '@/config/firebase';

export const firebaseFunctions = getFunctions(firebaseApp, 'us-central1');
