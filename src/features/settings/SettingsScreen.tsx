import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

export function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { profile, syncStatus } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const accountLabel = user?.email?.endsWith('@phone.moveon.app')
    ? '전화번호 로그인 계정'
    : user?.email ?? '전화번호 로그인 계정';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="설정 닫기"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons color="#4B4035" name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileBlock}>
          <Text style={styles.kicker}>MY ROOM</Text>
          <Text style={styles.profileName}>{profile.name || 'MoveOn'}의 방</Text>
          <Text style={styles.profileMeta}>
            {profile.petName || '반려동물'}와 함께 · {syncStatus === 'synced' ? 'Firebase 저장됨' : '동기화 확인 중'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons color="#707B59" name="person-outline" size={21} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{accountLabel}</Text>
            <Text numberOfLines={1} style={styles.rowDescription}>UID · {user?.uid ?? '-'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>안내</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'replay' } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.rowIcon}>
            <Ionicons color="#707B59" name="map-outline" size={21} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>사용방법 다시 보기</Text>
            <Text style={styles.rowDescription}>방 사용법과 첫 공부 경험을 다시 살펴봐요.</Text>
          </View>
          <Ionicons color="#8A7D6D" name="chevron-forward" size={18} />
        </Pressable>

        <Text style={styles.sectionTitle}>알림</Text>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons color="#707B59" name="newspaper-outline" size={21} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Move On Times 알림</Text>
            <Text style={styles.rowDescription}>
              {profile.magazineNotificationEnabled
                ? '주간·월간 발행 알림을 받도록 설정되어 있어요.'
                : '알림은 추후 기기 연결 후 사용할 수 있어요.'}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#8D554A" />
          ) : (
            <>
              <Ionicons color="#8D554A" name="log-out-outline" size={19} />
              <Text style={styles.signOutText}>로그아웃</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.note}>
          작은 행동도 충분해요. MoveOn은 사용자를 평가하거나 행동을 재촉하지 않습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5EFE5' },
  header: { height: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  headerTitle: { color: '#3C332B', fontSize: 17, fontWeight: '900' },
  headerSide: { width: 40 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 30 },
  profileBlock: { marginTop: 8, marginBottom: 30, paddingVertical: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D9CFBF' },
  kicker: { color: '#85906C', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  profileName: { marginTop: 8, color: '#3B322A', fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  profileMeta: { marginTop: 7, color: '#887A6A', fontSize: 10 },
  sectionTitle: { marginTop: 18, marginBottom: 9, color: '#817565', fontSize: 10, fontWeight: '900' },
  row: { minHeight: 84, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#DDD3C4', borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.66)', flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EDDD' },
  rowCopy: { flex: 1, paddingHorizontal: 12 },
  rowTitle: { color: '#40362D', fontSize: 13, fontWeight: '900' },
  rowDescription: { marginTop: 5, color: '#897C6D', fontSize: 9, lineHeight: 14 },
  signOutButton: { minHeight: 50, marginTop: 28, borderWidth: 1, borderColor: '#E1C9C1', borderRadius: 17, backgroundColor: '#FFF8F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signOutText: { color: '#8D554A', fontSize: 13, fontWeight: '900' },
  note: { marginTop: 24, color: '#948778', fontSize: 9, lineHeight: 15, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
