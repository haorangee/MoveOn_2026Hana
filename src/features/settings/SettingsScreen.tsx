import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { loadAchievementSummaries } from '@/features/achievements/services/achievementService';
import type { AchievementSummary } from '@/features/achievements/types/achievement';
import { ACTIVITY_CATEGORY, type ActivityCategory } from '@/features/activity/constants/activityCategory';
import { calculateCategoryLevelProgress, calculateTotalLevelProgress } from '@/features/activity/levels';
import { useAuth } from '@/features/auth/AuthProvider';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

type CategoryProgressRow = {
  categoryId: ActivityCategory;
  xp: number;
  level: number;
  completionCount: number;
  totalGrapes: number;
};

type CategoryCard = {
  id: ActivityCategory;
  label: string;
  color: string;
};

type ProfileStats = {
  totalXp: number;
  level: number;
  grapes: number;
};

const CATEGORY_CARDS: CategoryCard[] = [
  { id: ACTIVITY_CATEGORY.STUDY, label: '공부', color: '#6288A8' },
  { id: ACTIVITY_CATEGORY.CLEANING, label: '청소', color: '#78906B' },
  { id: ACTIVITY_CATEGORY.SHOWER, label: '샤워', color: '#B7A0D8' },
  { id: ACTIVITY_CATEGORY.WATER, label: '물 마시기', color: '#87B6C8' },
];

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value ?? fallback);
  if (!Number.isFinite(numberValue) || Number.isNaN(numberValue)) return fallback;
  return Math.max(0, Math.floor(numberValue));
}

function profileTitle(email?: string | null) {
  if (!email) return '로그인 계정';
  return email.endsWith('@phone.moveon.app') ? '휴대전화 로그인 계정' : email;
}

export function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { profile, syncStatus, userId } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgressRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary[]>([]);

  useEffect(() => {
    let active = true;

    async function loadProfileData() {
      if (!userId) {
        if (active) {
          setProfileStats(null);
          setCategoryProgress([]);
          setAchievements([]);
        }
        return;
      }

      try {
        const [profileSnapshot, achievementSummary, ...categorySnapshots] = await Promise.all([
          getDoc(doc(firestore, 'users', userId)),
          loadAchievementSummaries(userId),
          ...CATEGORY_CARDS.map((category) => (
            getDoc(doc(firestore, 'users', userId, 'categoryProgress', category.id))
          )),
        ]);

        const remoteProfile = profileSnapshot.exists()
          ? (profileSnapshot.data() as { grapes?: number; level?: number; totalXp?: number })
          : null;

        const rows = CATEGORY_CARDS.map((category, index) => {
          const snapshot = categorySnapshots[index];
          const data = snapshot?.exists()
            ? (snapshot.data() as Partial<CategoryProgressRow>)
            : null;
          const xp = normalizeNumber(data?.xp);

          return {
            categoryId: category.id,
            xp,
            level: normalizeNumber(data?.level, calculateCategoryLevelProgress(xp).level),
            completionCount: normalizeNumber(data?.completionCount),
            totalGrapes: normalizeNumber(data?.totalGrapes),
          };
        });

        if (active) {
          setProfileStats({
            totalXp: normalizeNumber(remoteProfile?.totalXp, profile.totalXp ?? 0),
            level: Math.max(1, normalizeNumber(remoteProfile?.level, profile.level ?? 1)),
            grapes: normalizeNumber(remoteProfile?.grapes, profile.grapes ?? 0),
          });
          setCategoryProgress(rows.sort((left, right) => right.xp - left.xp));
          setAchievements(achievementSummary);
        }
      } catch {
        if (active) {
          setProfileStats(null);
          setCategoryProgress([]);
          setAchievements([]);
        }
      }
    }

    void loadProfileData();

    return () => {
      active = false;
    };
  }, [profile.grapes, profile.level, profile.totalXp, userId]);

  const stats = profileStats ?? {
    totalXp: profile.totalXp ?? 0,
    level: profile.level ?? 1,
    grapes: profile.grapes ?? 0,
  };
  const totalLevel = calculateTotalLevelProgress(stats.totalXp);

  const categorySummary = useMemo(() => {
    return CATEGORY_CARDS.map((category) => {
      const progress = categoryProgress.find((item) => item.categoryId === category.id);
      const xp = progress?.xp ?? 0;
      const levelProgress = calculateCategoryLevelProgress(xp);
      return {
        ...category,
        xp,
        level: progress?.level ?? levelProgress.level,
        completionCount: progress?.completionCount ?? 0,
        totalGrapes: progress?.totalGrapes ?? 0,
        progressLabel: levelProgress.nextLevelRequiredXp === null
          ? '최고 레벨'
          : `Lv.${levelProgress.level} · ${levelProgress.xpIntoCurrentLevel}/${levelProgress.nextLevelRequiredXp - levelProgress.currentLevelRequiredXp} XP`,
      };
    }).sort((left, right) => right.xp - left.xp);
  }, [categoryProgress]);

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
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons color="#4B4035" name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>프로필</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileBlock}>
          <Text style={styles.kicker}>MY ROOM</Text>
          <Text style={styles.profileName}>{profile.name || 'MoveOn 사용자'}님</Text>
          <Text style={styles.profileMeta}>
            {profile.petName || '반려동물'}과 함께 · {syncStatus === 'synced' ? 'Firebase 동기화 완료' : '동기화 확인 중'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>전체 레벨</Text>
              <Text style={styles.statValue}>Lv.{stats.level}</Text>
              <Text style={styles.statSubValue}>
                {totalLevel.nextLevelRequiredXp === null
                  ? '최고 레벨'
                  : `Lv.${totalLevel.level} · ${totalLevel.xpIntoCurrentLevel}/${totalLevel.nextLevelRequiredXp - totalLevel.currentLevelRequiredXp} XP`}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>경험치</Text>
              <Text style={styles.statValue}>{stats.totalXp}</Text>
              <Text style={styles.statSubValue}>누적 XP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>포도</Text>
              <Text style={styles.statValue}>{stats.grapes}</Text>
              <Text style={styles.statSubValue}>보유 개수</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>카테고리별 진행도</Text>
        <View style={styles.categoryGrid}>
          {categorySummary.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={styles.categoryTitle}>{category.label}</Text>
                <Text style={styles.categoryXp}>{category.xp} XP</Text>
              </View>
              <Text style={styles.categoryLevel}>{category.progressLabel}</Text>
              <View style={styles.categoryMetaRow}>
                <Text style={styles.categoryMetaText}>레벨 {category.level}</Text>
                <Text style={styles.categoryMetaText}>완료 {category.completionCount}회</Text>
                <Text style={styles.categoryMetaText}>포도 {category.totalGrapes}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>업적</Text>
        <View style={styles.achievementGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.achievementId}
              style={[
                styles.achievementCard,
                achievement.status === 'earned' ? styles.achievementCardActive : styles.achievementCardInactive,
              ]}
            >
              <View style={styles.achievementHeader}>
                <View style={[
                  styles.achievementIcon,
                  achievement.status === 'earned' ? styles.achievementIconActive : styles.achievementIconInactive,
                ]}>
                  <Ionicons
                    color={achievement.status === 'earned' ? '#FFFFFF' : '#8C7B68'}
                    name={achievement.status === 'earned' ? 'trophy' : 'ellipse-outline'}
                    size={16}
                  />
                </View>
                <View style={styles.achievementCopy}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
                <Text style={styles.achievementStatus}>
                  {achievement.status === 'earned' ? '달성' : '진행 중'}
                </Text>
              </View>
              <View style={styles.achievementFooter}>
                <Text style={styles.achievementProgress}>{achievement.progressText}</Text>
                <Text style={styles.achievementReward}>보상 포도 +{achievement.rewardGrapes}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>계정</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile/customize' as Href)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.rowIcon}>
            <Ionicons color="#707B59" name="sparkles-outline" size={21} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>캐릭터·펫 변경</Text>
            <Text style={styles.rowDescription}>내 방에 함께 있을 캐릭터와 펫을 다시 선택해요.</Text>
          </View>
          <Ionicons color="#8A7D6D" name="chevron-forward" size={18} />
        </Pressable>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons color="#707B59" name="person-outline" size={21} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{profileTitle(user?.email)}</Text>
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
            <Text style={styles.rowDescription}>방 사용법과 첫 경험 튜토리얼을 다시 볼 수 있어요.</Text>
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
              {profile.magazineNotificationEnabled ? '주간·월간 발행 알림이 켜져 있어요.' : '알림은 추후 기능에서 설정할 수 있어요.'}
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
          MoveOn은 작은 행동이 쌓여 방과 이야기가 자라는 경험을 만드는 서비스예요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5EFE5' },
  header: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { color: '#3C332B', fontSize: 17, fontWeight: '900' },
  headerSide: { width: 40 },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  profileBlock: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 22,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D9CFBF',
  },
  kicker: { color: '#85906C', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  profileName: { marginTop: 8, color: '#3B322A', fontSize: 25, fontWeight: '900' },
  profileMeta: { marginTop: 7, color: '#887A6A', fontSize: 10 },
  statsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD3C4',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  statLabel: {
    color: '#8A7D6D',
    fontSize: 9,
    fontWeight: '900',
  },
  statValue: {
    marginTop: 7,
    color: '#3C332B',
    fontSize: 20,
    fontWeight: '900',
  },
  statSubValue: {
    marginTop: 4,
    color: '#8B7E70',
    fontSize: 9,
  },
  sectionTitle: { marginTop: 18, marginBottom: 9, color: '#817565', fontSize: 10, fontWeight: '900' },
  categoryGrid: {
    gap: 10,
  },
  categoryCard: {
    padding: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#DDD3C4',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTitle: {
    flex: 1,
    color: '#40362D',
    fontSize: 13,
    fontWeight: '900',
  },
  categoryXp: {
    color: '#7C6F60',
    fontSize: 10,
    fontWeight: '800',
  },
  categoryLevel: {
    marginTop: 8,
    color: '#5C5147',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryMetaText: {
    color: '#8B7E70',
    fontSize: 9,
  },
  achievementGrid: {
    gap: 10,
  },
  achievementCard: {
    padding: 14,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  achievementCardActive: {
    borderColor: '#D9C08E',
  },
  achievementCardInactive: {
    borderColor: '#E5DACD',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  achievementIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconActive: {
    backgroundColor: '#9D8558',
  },
  achievementIconInactive: {
    backgroundColor: '#F1E8DB',
  },
  achievementCopy: {
    flex: 1,
  },
  achievementTitle: {
    color: '#40362D',
    fontSize: 13,
    fontWeight: '900',
  },
  achievementDescription: {
    marginTop: 3,
    color: '#897C6D',
    fontSize: 9,
  },
  achievementStatus: {
    color: '#7A6A59',
    fontSize: 10,
    fontWeight: '800',
  },
  achievementProgress: {
    color: '#6C5E50',
    fontSize: 10,
    fontWeight: '700',
  },
  achievementFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  achievementReward: {
    color: '#8A6A3E',
    fontSize: 10,
    fontWeight: '800',
  },
  row: {
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#DDD3C4',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.66)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EDDD',
  },
  rowCopy: { flex: 1, paddingHorizontal: 12 },
  rowTitle: { color: '#40362D', fontSize: 13, fontWeight: '900' },
  rowDescription: { marginTop: 5, color: '#897C6D', fontSize: 9, lineHeight: 14 },
  signOutButton: {
    minHeight: 50,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#E1C9C1',
    borderRadius: 17,
    backgroundColor: '#FFF8F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: { color: '#8D554A', fontSize: 13, fontWeight: '900' },
  note: { marginTop: 24, color: '#948778', fontSize: 9, lineHeight: 15, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
