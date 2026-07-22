import { cert, getApps, initializeApp } from 'firebase-admin/app';

export function getMoveOnAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('SERVER_CONFIGURATION_MISSING');
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}
