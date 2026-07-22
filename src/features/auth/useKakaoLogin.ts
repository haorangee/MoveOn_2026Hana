import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';

WebBrowser.maybeCompleteAuthSession();

const kakaoDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
  tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

type KakaoTokenResponse = {
  firebaseCustomToken?: string;
  message?: string;
};

function kakaoAuthEndpoint() {
  const baseUrl = process.env.EXPO_PUBLIC_AUTH_API_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('카카오 로그인 서버 주소가 설정되지 않았어요. EXPO_PUBLIC_AUTH_API_URL을 확인해 주세요.');
  }
  return `${baseUrl}/api/auth/kakao`;
}

export function useKakaoLogin() {
  const { signInWithCustomToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const clientId = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim() ?? '';
  const redirectUri = useMemo(() => AuthSession.makeRedirectUri({
    scheme: 'moveon',
    path: 'auth/kakao',
  }), []);

  const [request, , promptAsync] = AuthSession.useAuthRequest({
    clientId: clientId || 'missing-kakao-rest-api-key',
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ['profile_nickname'],
    usePKCE: true,
  }, kakaoDiscovery);

  const signInWithKakao = useCallback(async () => {
    if (!clientId) {
      throw new Error('카카오 REST API 키가 설정되지 않았어요.');
    }
    if (!request) {
      throw new Error('카카오 로그인 준비 중이에요. 잠시 후 다시 시도해 주세요.');
    }

    setIsLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return false;
      if (result.type !== 'success' || typeof result.params.code !== 'string') {
        throw new Error('카카오 인증을 완료하지 못했어요. 다시 시도해 주세요.');
      }

      const currentFirebaseIdToken = user ? await user.getIdToken() : undefined;
      const response = await fetch(kakaoAuthEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: result.params.code,
          codeVerifier: request.codeVerifier,
          redirectUri,
          currentFirebaseIdToken,
        }),
      });
      const payload = await response.json() as KakaoTokenResponse;

      if (!response.ok || !payload.firebaseCustomToken) {
        throw new Error(payload.message || '카카오 로그인 서버 연결에 실패했어요.');
      }

      await signInWithCustomToken(payload.firebaseCustomToken);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, promptAsync, redirectUri, request, signInWithCustomToken, user]);

  return {
    isConfigured: Boolean(clientId && process.env.EXPO_PUBLIC_AUTH_API_URL),
    isLoading,
    redirectUri,
    signInWithKakao,
  };
}
