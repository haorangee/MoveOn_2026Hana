import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { createCleaningSession, completeCleaningSession } from '@/features/home/data/cleaningRepository';
import { ActivityRewardModal } from '@/features/activity/rewards/components/ActivityRewardModal';
import { useActivityRewardModal } from '@/features/activity/rewards/hooks/useActivityRewardModal';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Body, Heading, Muted, Title } from '@/shared/components/Typography';
import { theme } from '@/shared/theme';

type CleaningPhase = 'before' | 'cleaning' | 'after' | 'result';
const CLEANING_STORAGE_KEY = '@moveon/room-cleaning/v1';

export function CleaningScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useOnboarding();
  const [phase, setPhase] = useState<CleaningPhase>('before');
  const [beforeImageUri, setBeforeImageUri] = useState<string | null>(null);
  const [afterImageUri, setAfterImageUri] = useState<string | null>(null);
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
  const [cleaningSessionId, setCleaningSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const {
    rewardResult,
    rewardModalVisible,
    rewardCategoryId,
    showRewardResult,
    clearRewardResult,
  } = useActivityRewardModal();

  const hasBeforePhoto = Boolean(beforeImageUri);
  const hasAfterPhoto = Boolean(afterImageUri);

  const cameraLabel = useMemo(() => (
    phase === 'before'
      ? '청소 전 모습을 찍어주세요'
      : '청소 후 모습을 찍어주세요'
  ), [phase]);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    setPermissionRequested(true);
    if (!permission.granted) {
      Alert.alert('카메라 권한이 필요해요', '청소 사진을 찍으려면 카메라 권한을 허용해 주세요.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      allowsEditing: true,
      quality: 0.92,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.uri) return;

    if (phase === 'before') {
      setBeforeImageUri(asset.uri);
    } else if (phase === 'after') {
      setAfterImageUri(asset.uri);
    }
  };

  const retakePhoto = () => {
    if (phase === 'before') {
      setBeforeImageUri(null);
      setBeforeImageUrl(null);
      setCleaningSessionId(null);
      setStartedAt(null);
    } else {
      setAfterImageUri(null);
      setAfterImageUrl(null);
      setCompletedAt(null);
    }
  };

  const startCleaning = async () => {
    if (!user || !beforeImageUri) return;
    setIsSaving(true);
    try {
      const record = await createCleaningSession(user.uid, beforeImageUri);
      setCleaningSessionId(record.cleaningSessionId);
      setBeforeImageUrl(record.beforeImageUrl);
      setStartedAt(new Date().toISOString());
      setPhase('cleaning');
    } catch (error) {
      Alert.alert('청소를 시작할 수 없어요', '비포 사진 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const finishCleaning = async () => {
    if (!user || !cleaningSessionId || !afterImageUri) return;
    setIsSaving(true);
    try {
      const { afterImageUrl: url, rewardResult: nextRewardResult } = await completeCleaningSession(user.uid, cleaningSessionId, afterImageUri);
      setAfterImageUrl(url);
      setCompletedAt(new Date().toISOString());
      await AsyncStorage.setItem(CLEANING_STORAGE_KEY, String(Date.now()));
      showRewardResult('cleaning', nextRewardResult);
    } catch {
      Alert.alert('청소 완료를 저장할 수 없어요', '애프터 사진 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmReward = () => {
    clearRewardResult();
    setPhase('result');
  };

  const goHome = () => {
    router.back();
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Title>방 청소</Title>
        <Muted>비포와 애프터를 남기고, 청소 기록을 저장해요.</Muted>
      </View>

      {phase === 'before' ? (
        <Card>
          <View style={styles.stepRow}>
            <View style={[styles.step, styles.stepActive]}>
              <Text style={styles.stepTextActive}>1</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={styles.stepText}>3</Text>
            </View>
          </View>

          <Heading>{cameraLabel}</Heading>
          <Body style={styles.bodyCopy}>청소 전 사진이 있어야 다음 단계로 넘어갈 수 있어요.</Body>

          <View style={styles.previewFrame}>
            {beforeImageUri ? (
              <Image source={{ uri: beforeImageUri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.previewEmpty}>
                <Ionicons name="camera" size={30} color="#8C7C6B" />
                <Text style={styles.previewEmptyText}>
                  후면 카메라로 청소 전 모습을 찍어주세요
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void takePhoto()}
              style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
            >
              <Ionicons name="camera-outline" size={18} color="#5D5145" />
              <Text style={styles.outlineButtonText}>{beforeImageUri ? '다시 찍기' : '사진 찍기'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!hasBeforePhoto || isSaving}
              onPress={() => void startCleaning()}
              style={({ pressed }) => [
                styles.primaryButton,
                (!hasBeforePhoto || isSaving) && styles.disabled,
                pressed && hasBeforePhoto && styles.pressed,
              ]}
            >
              {isSaving ? <ActivityIndicator color="#FFF9ED" /> : <Text style={styles.primaryButtonText}>다음</Text>}
            </Pressable>
          </View>

          {permissionRequested && !hasBeforePhoto ? (
            <Muted>카메라 권한을 허용한 뒤 촬영을 진행해 주세요.</Muted>
          ) : null}
        </Card>
      ) : null}

      {phase === 'cleaning' ? (
        <Card>
          <Heading>청소를 시작할까요?</Heading>
          <Body style={styles.bodyCopy}>
            청소가 끝나면 아래 버튼을 눌러 애프터 사진을 찍어주세요.
          </Body>

          <View style={styles.roomStage}>
            {beforeImageUri ? (
              <ImageBackground
                source={{ uri: beforeImageUri }}
                style={styles.roomBackground}
                imageStyle={styles.roomBackgroundImage}
              >
                <View style={styles.cleaningOverlay} />
                <View style={styles.cleaningBadge}>
                  <Text style={styles.cleaningBadgeText}>청소 중</Text>
                </View>
              </ImageBackground>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={goHome}
              style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
            >
              <Text style={styles.outlineButtonText}>중단</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setPhase('after')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>청소 완료</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {phase === 'after' ? (
        <Card>
          <Heading>{cameraLabel}</Heading>
          <Body style={styles.bodyCopy}>청소가 끝난 같은 공간의 모습을 찍어주세요.</Body>

          <View style={styles.previewFrame}>
            {afterImageUri ? (
              <Image source={{ uri: afterImageUri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.previewEmpty}>
                <Ionicons name="camera" size={30} color="#8C7C6B" />
                <Text style={styles.previewEmptyText}>
                  같은 구도에서 애프터 사진을 찍어주세요
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void takePhoto()}
              style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
            >
              <Ionicons name="camera-outline" size={18} color="#5D5145" />
              <Text style={styles.outlineButtonText}>{afterImageUri ? '다시 찍기' : '사진 찍기'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!hasAfterPhoto || isSaving}
              onPress={() => void finishCleaning()}
              style={({ pressed }) => [
                styles.primaryButton,
                (!hasAfterPhoto || isSaving) && styles.disabled,
                pressed && hasAfterPhoto && styles.pressed,
              ]}
            >
              {isSaving ? <ActivityIndicator color="#FFF9ED" /> : <Text style={styles.primaryButtonText}>완료</Text>}
            </Pressable>
          </View>
        </Card>
      ) : null}

      {phase === 'result' ? (
        <Card>
          <Heading>청소 결과</Heading>
          <Body style={styles.bodyCopy}>AI가 청소 전후 사진을 분석할 예정이에요.</Body>

          <View style={styles.resultRow}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Before</Text>
              {beforeImageUrl ? (
                <Image source={{ uri: beforeImageUrl }} style={styles.resultImage} contentFit="cover" />
              ) : null}
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>After</Text>
              {afterImageUrl ? (
                <Image source={{ uri: afterImageUrl }} style={styles.resultImage} contentFit="cover" />
              ) : null}
            </View>
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {profile.name ? `${profile.name} 님의 청소 기록이 저장됐어요.` : '청소 기록이 저장됐어요.'}
            </Text>
            {startedAt && completedAt ? (
              <Text style={styles.summarySubText}>
                {new Date(startedAt).toLocaleString()} - {new Date(completedAt).toLocaleString()}
              </Text>
            ) : null}
            <Text style={styles.summarySubText}>
              {cleaningSessionId ? `세션 ID: ${cleaningSessionId}` : ''}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={goHome}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>홈으로 돌아가기</Text>
          </Pressable>
        </Card>
      ) : null}

      <ActivityRewardModal
        visible={rewardModalVisible}
        categoryId={rewardCategoryId ?? 'cleaning'}
        result={rewardResult}
        onConfirm={confirmReward}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 4,
  },
  bodyCopy: {
    marginTop: 4,
  },
  stepRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE7D9',
  },
  stepActive: {
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  stepText: {
    color: '#7D6F61',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 10,
    backgroundColor: theme.colors.border,
  },
  previewFrame: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8F3E7',
    aspectRatio: 3 / 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    gap: 10,
  },
  previewEmptyText: {
    color: '#6D6255',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  roomStage: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#EEE4D4',
    aspectRatio: 3 / 4,
  },
  roomBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roomBackgroundImage: {
    opacity: 0.55,
  },
  cleaningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 231, 0.4)',
  },
  cleaningBadge: {
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(93, 118, 81, 0.9)',
  },
  cleaningBadgeText: {
    color: '#FFF9EE',
    fontSize: 12,
    fontWeight: '900',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFDF8',
  },
  outlineButtonText: {
    color: '#625547',
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: '#FFF9ED',
    fontSize: 14,
    fontWeight: '900',
  },
  resultRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  resultCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FAF6EE',
  },
  resultLabel: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#6C5E50',
    fontSize: 11,
    fontWeight: '900',
    backgroundColor: '#EFE5D6',
  },
  resultImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  summary: {
    marginTop: 14,
    gap: 4,
  },
  summaryText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  summarySubText: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  disabled: {
    opacity: 0.56,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
