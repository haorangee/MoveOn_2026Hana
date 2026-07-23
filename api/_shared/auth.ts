import { getAuth } from 'firebase-admin/auth';
import { getMoveOnAdminApp } from './firebaseAdmin';
import type { ApiRequest } from './http';

export async function requireUserId(request: ApiRequest) {
  const authorization = request.headers.authorization;
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = value?.startsWith('Bearer ') ? value.slice(7).trim() : '';

  if (!token) throw new Error('UNAUTHORIZED');

  const decoded = await getAuth(getMoveOnAdminApp()).verifyIdToken(token);
  return decoded.uid;
}
