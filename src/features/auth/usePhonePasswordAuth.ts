import * as Crypto from 'expo-crypto';
import { FirebaseError } from 'firebase/app';
import { useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';

type PhoneAuthAction = 'sign-in' | 'sign-up';

const PHONE_ID_DOMAIN = 'phone.moveon.app';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/credential-already-in-use': '이미 가입된 전화번호예요. 로그인으로 이어가 주세요.',
  'auth/email-already-in-use': '이미 가입된 전화번호예요. 로그인으로 이어가 주세요.',
  'auth/invalid-credential': '전화번호 또는 비밀번호가 맞지 않아요.',
  'auth/invalid-email': '전화번호 형식을 다시 확인해 주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  'auth/operation-not-allowed': 'Firebase Authentication에서 이메일/비밀번호 로그인을 활성화해 주세요.',
  'auth/too-many-requests': '로그인 시도가 많아요. 잠시 뒤 다시 시도해 주세요.',
  'auth/weak-password': '비밀번호는 8자 이상으로 만들어 주세요.',
};

export function formatKoreanMobileInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

function normalizeKoreanMobileNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!/^010\d{8}$/.test(digits)) {
    throw new Error('010으로 시작하는 휴대전화 번호를 확인해 주세요.');
  }
  return `+82${digits.slice(1)}`;
}

async function phoneNumberToFirebaseEmail(phoneNumber: string) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    phoneNumber,
  );
  return `phone_${digest}@${PHONE_ID_DOMAIN}`;
}

function authErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code]
      ?? '로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
  }
  return error instanceof Error
    ? error.message
    : '로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
}

export function usePhonePasswordAuth() {
  const { signIn, signUp } = useAuth();

  const authenticate = useCallback(async (
    action: PhoneAuthAction,
    phoneNumber: string,
    password: string,
  ) => {
    const normalizedPhoneNumber = normalizeKoreanMobileNumber(phoneNumber);
    const firebaseEmail = await phoneNumberToFirebaseEmail(normalizedPhoneNumber);

    try {
      if (action === 'sign-up') {
        await signUp(firebaseEmail, password);
      } else {
        await signIn(firebaseEmail, password);
      }
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }, [signIn, signUp]);

  return { authenticate };
}
