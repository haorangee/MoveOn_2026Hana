import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateAge } from '@/features/onboarding/birthDate';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { FirstActionTutorialPage } from '@/features/onboarding/pages/FirstActionTutorialPage';
import { MoveOnTimesTutorialPage } from '@/features/onboarding/pages/MoveOnTimesTutorialPage';
import { ProfileSetupPage } from '@/features/onboarding/pages/ProfileSetupPage';
import { RecoveryTutorialPage } from '@/features/onboarding/pages/RecoveryTutorialPage';
import { RoomTutorialPage } from '@/features/onboarding/pages/RoomTutorialPage';
import { StudyTutorialPage } from '@/features/onboarding/pages/StudyTutorialPage';
import { WelcomePage } from '@/features/onboarding/pages/WelcomePage';
import { useOnboardingTutorial } from '@/features/onboarding/useOnboardingTutorial';

export function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const replay = params.mode === 'replay';
  const { completeOnboarding, profile, userId } = useOnboarding();
  const { state, isHydrated, update, complete } = useOnboardingTutorial({
    nickname: profile.name,
    birthDate: profile.birthDate,
    selectedPetSpecies: profile.petSpecies,
    petName: profile.petName,
    selectedCharacterId: profile.characterId,
    selectedChapter: profile.chapter,
    magazineNotificationEnabled: profile.magazineNotificationEnabled,
    firstBookCreated: false,
  }, replay, userId ?? 'guest');
  const [showSkipNotice, setShowSkipNotice] = useState(false);

  const goToNextGuide = useCallback(() => {
    if (state.currentStep === 4 && replay) {
      update({ phase: 'first-action' });
      return;
    }
    update({ currentStep: Math.min(5, state.currentStep + 1) });
  }, [replay, state.currentStep, update]);

  const handleBack = () => {
    setShowSkipNotice(false);
    if (state.phase === 'first-action') {
      update({ phase: 'guide', currentStep: replay ? 4 : 5 });
      return;
    }
    if (state.currentStep === 5 && state.profileSetupStep > 0) {
      update({ profileSetupStep: state.profileSetupStep - 1 });
      return;
    }
    update({ currentStep: Math.max(0, state.currentStep - 1) });
  };

  const finishOnboarding = useCallback(async () => {
    if (!replay) {
      const birthDate = state.birthDate || profile.birthDate;
      await completeOnboarding({
        name: state.nickname.trim() || '무브너',
        age: calculateAge(birthDate),
        birthDate,
        petSpecies: state.selectedPetSpecies,
        petName: state.petName.trim(),
        characterId: state.selectedCharacterId,
        chapter: state.selectedChapter,
        magazineNotificationEnabled: state.magazineNotificationEnabled === true,
      });
    }

    await complete();
    router.replace('/(tabs)');
  }, [complete, completeOnboarding, profile.birthDate, replay, router, state]);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7B8662" />
        <Text style={styles.loadingText}>방을 준비하고 있어요.</Text>
      </View>
    );
  }

  const firstAction = state.phase === 'first-action';
  const canGoBack = firstAction || state.currentStep > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <OnboardingProgress
          canGoBack={canGoBack}
          currentStep={state.currentStep}
          firstAction={firstAction}
          onBack={handleBack}
          onSkip={firstAction ? () => setShowSkipNotice(true) : state.currentStep < 5 ? goToNextGuide : undefined}
        />

        <View style={styles.page}>
          {firstAction ? (
            <FirstActionTutorialPage
              characterId={state.selectedCharacterId}
              firstBookCreated={state.firstBookCreated}
              onBookCreated={() => update({ firstBookCreated: true })}
              onDone={() => void finishOnboarding()}
              petSpecies={state.selectedPetSpecies}
            />
          ) : null}

          {!firstAction && state.currentStep === 0 ? (
            <WelcomePage
              characterId={state.selectedCharacterId}
              onStart={goToNextGuide}
              petSpecies={state.selectedPetSpecies}
            />
          ) : null}

          {!firstAction && state.currentStep === 1 ? (
            <RoomTutorialPage
              characterId={state.selectedCharacterId}
              onDeskPress={goToNextGuide}
              petSpecies={state.selectedPetSpecies}
            />
          ) : null}

          {!firstAction && state.currentStep === 2 ? (
            <StudyTutorialPage
              characterId={state.selectedCharacterId}
              onContinue={goToNextGuide}
              petSpecies={state.selectedPetSpecies}
            />
          ) : null}

          {!firstAction && state.currentStep === 3 ? (
            <RecoveryTutorialPage
              characterId={state.selectedCharacterId}
              onContinue={goToNextGuide}
              petSpecies={state.selectedPetSpecies}
            />
          ) : null}

          {!firstAction && state.currentStep === 4 ? (
            <MoveOnTimesTutorialPage
              characterId={state.selectedCharacterId}
              nickname={state.nickname}
              onContinue={goToNextGuide}
              petSpecies={state.selectedPetSpecies}
            />
          ) : null}

          {!firstAction && state.currentStep === 5 ? (
            <ProfileSetupPage
              onDone={() => update({ phase: 'first-action' })}
              state={state}
              update={update}
            />
          ) : null}

          {showSkipNotice ? (
            <View style={styles.skipNotice}>
              <Text style={styles.skipTitle}>첫 행동 체험을 건너뛸까요?</Text>
              <Text style={styles.skipDescription}>
                튜토리얼은 나중에 설정에서 다시 볼 수 있어요.
              </Text>
              <View style={styles.skipActions}>
                <Pressable
                  onPress={() => setShowSkipNotice(false)}
                  style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}
                >
                  <Text style={styles.keepButtonText}>계속 체험하기</Text>
                </Pressable>
                <Pressable
                  onPress={() => void finishOnboarding()}
                  style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
                >
                  <Text style={styles.skipButtonText}>내 방으로 가기</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EFE5' },
  safe: { flex: 1, backgroundColor: '#F5EFE5' },
  page: { flex: 1, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F5EFE5' },
  loadingText: { color: '#7C6F60', fontSize: 11, fontWeight: '700' },
  skipNotice: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#F8F2E8',
    shadowColor: '#342A21',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  skipTitle: { color: '#3E342B', fontSize: 16, fontWeight: '900' },
  skipDescription: { marginTop: 7, color: '#807263', fontSize: 11, lineHeight: 17 },
  skipActions: { marginTop: 15, flexDirection: 'row', gap: 8 },
  keepButton: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: '#CFC4B5', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  keepButtonText: { color: '#645748', fontSize: 11, fontWeight: '800' },
  skipButton: { flex: 1, minHeight: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#625244' },
  skipButtonText: { color: '#FFF9EE', fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.82 },
});
