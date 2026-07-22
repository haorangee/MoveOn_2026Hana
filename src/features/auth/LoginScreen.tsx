import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useKakaoLogin } from '@/features/auth/useKakaoLogin';
import {
  formatKoreanMobileInput,
  usePhonePasswordAuth,
} from '@/features/auth/usePhonePasswordAuth';

type AuthMode = 'sign-in' | 'sign-up';

export function LoginScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { authenticate } = usePhonePasswordAuth();
  const {
    isLoading: isKakaoLoading,
    signInWithKakao,
  } = useKakaoLogin();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setPasswordConfirm('');
    setErrorMessage(null);
  };

  const submit = async () => {
    if (!phoneNumber || !password) {
      setErrorMessage('전화번호와 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상으로 입력해 주세요.');
      return;
    }
    if (isSignUp && password !== passwordConfirm) {
      setErrorMessage('비밀번호 확인이 일치하지 않아요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authenticate(mode, phoneNumber, password);
      router.replace('/');
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? error.message
        : '로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitKakao = async () => {
    setErrorMessage(null);
    try {
      const didSignIn = await signInWithKakao();
      if (didSignIn) router.replace('/');
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? error.message
        : '카카오 로그인 중 문제가 생겼어요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View pointerEvents="none" style={styles.sunGlow} />
        <View pointerEvents="none" style={styles.leafGlow} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Ionicons color="#819160" name="leaf" size={24} />
              <Text style={styles.brand}>MoveOn</Text>
            </View>
            <Text style={styles.kicker}>내 방으로 돌아오는 시간</Text>
            <Text style={styles.title}>
              {isSignUp ? '나의 방을 만들어요' : '다시 만나서 반가워요'}
            </Text>
            <Text style={styles.description}>
              {isSignUp
                ? '휴대전화 번호를 아이디로 정하고 나의 방을 시작해요.'
                : '전화번호와 비밀번호로 저장된 방을 불러올게요.'}
            </Text>
          </View>

          <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable
              accessibilityRole="tab"
              onPress={() => switchMode('sign-in')}
              style={[styles.tab, !isSignUp && styles.activeTab]}
            >
              <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>로그인</Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              onPress={() => switchMode('sign-up')}
              style={[styles.tab, isSignUp && styles.activeTab]}
            >
              <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>회원가입</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>휴대전화 번호</Text>
          <View style={styles.inputShell}>
            <Ionicons color="#9B8E7D" name="phone-portrait-outline" size={19} />
            <TextInput
              autoComplete="tel"
              editable={!isSubmitting}
              keyboardType="phone-pad"
              onChangeText={(value) => setPhoneNumber(formatKoreanMobileInput(value))}
              onSubmitEditing={() => undefined}
              placeholder="010 1234 5678"
              placeholderTextColor="#B7AB9C"
              style={styles.input}
              value={phoneNumber}
            />
          </View>

          {isSignUp && (
            <View style={styles.phoneNotice}>
              <Ionicons color="#7D8964" name="information-circle-outline" size={16} />
              <Text style={styles.phoneNoticeText}>
                현재는 SMS 인증 없이 전화번호를 로그인 아이디로만 사용해요.
              </Text>
            </View>
          )}

          <Text style={styles.label}>비밀번호</Text>
          <View style={styles.inputShell}>
            <Ionicons color="#9B8E7D" name="lock-closed-outline" size={19} />
            <TextInput
              autoCapitalize="none"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              editable={!isSubmitting}
              onChangeText={setPassword}
              placeholder="8자 이상 입력해 주세요"
              placeholderTextColor="#B7AB9C"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          {isSignUp && (
            <>
              <Text style={styles.label}>비밀번호 확인</Text>
              <View style={styles.inputShell}>
                <Ionicons color="#9B8E7D" name="shield-checkmark-outline" size={19} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!isSubmitting}
                  onChangeText={setPasswordConfirm}
                  onSubmitEditing={() => void submit()}
                  placeholder="비밀번호를 한 번 더 입력해 주세요"
                  placeholderTextColor="#B7AB9C"
                  secureTextEntry
                  style={styles.input}
                  value={passwordConfirm}
                />
              </View>
            </>
          )}

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons color="#A45F50" name="alert-circle-outline" size={17} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || isKakaoLoading}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
              (isSubmitting || isKakaoLoading) && styles.disabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFDF7" />
            ) : (
              <>
                <Text style={styles.submitText}>{isSignUp ? '전화번호로 방 만들기' : '내 방으로 들어가기'}</Text>
                <Ionicons color="#FFFDF7" name="arrow-forward" size={20} />
              </>
            )}
          </Pressable>

          {user?.isAnonymous && isSignUp && (
            <View style={styles.preserveNote}>
              <Ionicons color="#79855F" name="sparkles-outline" size={16} />
              <Text style={styles.preserveText}>현재 방과 기록은 이 계정에 그대로 연결돼요.</Text>
            </View>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>다른 방법으로 계속</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            accessibilityLabel="카카오로 계속하기"
            accessibilityRole="button"
            disabled={isSubmitting || isKakaoLoading}
            onPress={() => void submitKakao()}
            style={({ pressed }) => [
              styles.kakaoButton,
              pressed && styles.pressed,
              (isSubmitting || isKakaoLoading) && styles.disabled,
            ]}
          >
            {isKakaoLoading ? (
              <ActivityIndicator color="#191919" />
            ) : (
              <>
                <Ionicons color="#191919" name="chatbubble" size={18} />
                <Text style={styles.kakaoText}>카카오로 계속하기</Text>
              </>
            )}
          </Pressable>
          </View>

          <Text style={styles.footer}>작은 행동 하나가 당신의 세상을 바꿉니다.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E7' },
  keyboardView: { flex: 1, overflow: 'hidden' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  sunGlow: { position: 'absolute', top: -95, right: -65, width: 245, height: 245, borderRadius: 124, backgroundColor: '#FFF0C9', opacity: 0.52 },
  leafGlow: { position: 'absolute', bottom: -100, left: -88, width: 250, height: 250, borderRadius: 125, backgroundColor: '#E5EBD6', opacity: 0.74 },
  header: { width: '100%', maxWidth: 480, alignSelf: 'center', marginBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 22 },
  brand: { color: '#3F352C', fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  kicker: { color: '#7B8961', fontSize: 12, fontWeight: '800', marginBottom: 10 },
  title: { color: '#3B3129', fontSize: 29, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2, flexShrink: 1 },
  description: { color: '#887B6B', fontSize: 13, lineHeight: 21, marginTop: 10, maxWidth: 390 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 20, borderWidth: 1, borderColor: '#E4DACB', borderRadius: 27, backgroundColor: 'rgba(255,253,248,0.92)', shadowColor: '#6A5948', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: '#EFE8DC', marginBottom: 20 },
  tab: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  activeTab: { backgroundColor: '#FFFCF6' },
  tabText: { color: '#9A8C7A', fontSize: 13, fontWeight: '800' },
  activeTabText: { color: '#4D4237' },
  kakaoButton: { minHeight: 53, borderRadius: 16, backgroundColor: '#FEE500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  kakaoText: { color: '#191919', fontSize: 14, fontWeight: '900' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 17 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E7DED2' },
  dividerText: { color: '#9B8F81', fontSize: 9, fontWeight: '700' },
  label: { color: '#5A4D41', fontSize: 11, fontWeight: '800', marginBottom: 7, marginLeft: 3 },
  inputShell: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: '#DED3C4', borderRadius: 16, backgroundColor: '#FFFDF9', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  input: { flex: 1, color: '#3F352D', fontSize: 14, paddingVertical: 0, outlineStyle: 'none' as never },
  phoneNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, backgroundColor: '#F0F3E7', marginTop: -4, marginBottom: 15 },
  phoneNoticeText: { flex: 1, color: '#707A59', fontSize: 10, lineHeight: 15 },
  errorBox: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: '#FAECE7', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 },
  errorText: { flex: 1, color: '#8E5044', fontSize: 11, lineHeight: 16 },
  submitButton: { minHeight: 55, marginTop: 3, borderRadius: 18, backgroundColor: '#7D8D62', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#FFFDF7', fontSize: 15, fontWeight: '900' },
  preserveNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13 },
  preserveText: { color: '#78825F', fontSize: 10, fontWeight: '700' },
  footer: { marginTop: 22, textAlign: 'center', color: '#988B7C', fontSize: 10, fontWeight: '700' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  disabled: { opacity: 0.65 },
});
