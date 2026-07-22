import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMoveOnAdminApp } from '../_shared/firebaseAdmin';
import { configureCors, type ApiRequest, type ApiResponse } from '../_shared/http';

type KakaoRequestBody = {
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
  currentFirebaseIdToken?: string;
};

type KakaoTokenPayload = {
  access_token?: string;
};

type KakaoUser = {
  id?: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
  };
};

function serverConfig() {
  const kakaoClientId = process.env.KAKAO_REST_API_KEY;
  const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET;

  if (!kakaoClientId || !kakaoClientSecret) {
    throw new Error('SERVER_CONFIGURATION_MISSING');
  }

  return { kakaoClientId, kakaoClientSecret };
}

function parseBody(body: unknown): KakaoRequestBody {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as KakaoRequestBody;
    } catch {
      return {};
    }
  }
  return body && typeof body === 'object' ? body as KakaoRequestBody : {};
}

async function exchangeKakaoCode(body: Required<Pick<KakaoRequestBody, 'code' | 'redirectUri'>> & KakaoRequestBody) {
  const { kakaoClientId, kakaoClientSecret } = serverConfig();
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: kakaoClientId,
    client_secret: kakaoClientSecret,
    redirect_uri: body.redirectUri,
    code: body.code,
  });
  if (body.codeVerifier) form.set('code_verifier', body.codeVerifier);

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: form.toString(),
  });
  const payload = await response.json() as KakaoTokenPayload;

  if (!response.ok || !payload.access_token) {
    throw new Error('KAKAO_TOKEN_EXCHANGE_FAILED');
  }
  return payload.access_token;
}

async function loadKakaoUser(accessToken: string) {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json() as KakaoUser;

  if (!response.ok || typeof payload.id !== 'number') {
    throw new Error('KAKAO_USER_LOOKUP_FAILED');
  }
  return payload as KakaoUser & { id: number };
}

async function resolveFirebaseUid(kakaoUserId: number, currentFirebaseIdToken?: string) {
  const app = getMoveOnAdminApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const identity = firestore.collection('auth_identities').doc(`kakao:${kakaoUserId}`);
  let candidateUid = `kakao:${kakaoUserId}`;

  if (currentFirebaseIdToken) {
    try {
      const currentUser = await auth.verifyIdToken(currentFirebaseIdToken);
      candidateUid = currentUser.uid;
    } catch {
      // 유효하지 않은 기존 세션은 연결하지 않고 카카오 전용 UID를 사용합니다.
    }
  }

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(identity);
    const savedUid = snapshot.get('uid');
    if (typeof savedUid === 'string' && savedUid) return savedUid;

    transaction.create(identity, {
      provider: 'kakao',
      providerUserId: String(kakaoUserId),
      uid: candidateUid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return candidateUid;
  });
}

async function ensureFirebaseUser(uid: string, kakaoUser: KakaoUser) {
  const auth = getAuth(getMoveOnAdminApp());
  const displayName = kakaoUser.kakao_account?.profile?.nickname
    ?? kakaoUser.properties?.nickname;
  const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url
    ?? kakaoUser.properties?.profile_image;

  try {
    await auth.getUser(uid);
    if (displayName || photoURL) {
      await auth.updateUser(uid, { displayName, photoURL });
    }
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
    if (code !== 'auth/user-not-found') throw error;
    await auth.createUser({ uid, displayName, photoURL });
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  configureCors(request, response);

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'POST') {
    response.status(405).json({ message: 'POST 요청만 지원합니다.' });
    return;
  }

  const body = parseBody(request.body);
  if (!body.code || !body.redirectUri) {
    response.status(400).json({ message: '카카오 인증 정보가 올바르지 않아요.' });
    return;
  }

  try {
    const accessToken = await exchangeKakaoCode({ ...body, code: body.code, redirectUri: body.redirectUri });
    const kakaoUser = await loadKakaoUser(accessToken);
    const uid = await resolveFirebaseUid(kakaoUser.id, body.currentFirebaseIdToken);
    await ensureFirebaseUser(uid, kakaoUser);

    const firebaseCustomToken = await getAuth(getMoveOnAdminApp()).createCustomToken(uid, {
      authProvider: 'kakao',
      kakaoUserId: String(kakaoUser.id),
    });
    response.status(200).json({ firebaseCustomToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'SERVER_CONFIGURATION_MISSING') {
      response.status(503).json({ message: '카카오 로그인 서버 설정이 아직 완료되지 않았어요.' });
      return;
    }
    response.status(401).json({ message: '카카오 인증을 확인하지 못했어요. 다시 시도해 주세요.' });
  }
}
