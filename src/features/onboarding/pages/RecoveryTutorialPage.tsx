import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  TutorialRoomScene,
  type TutorialObjectId,
} from '@/features/onboarding/components/TutorialRoomScene';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

type RecoveryAction = 'clean' | 'water';

const actions: Array<{
  id: RecoveryAction;
  label: string;
  before: string;
  after: string;
  object: TutorialObjectId;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'clean',
    label: '방 청소',
    before: '방 청소를 누르면 더러운 바닥이 깨끗해져요.',
    after: '더러운 바닥이 사라지고 방이 정돈됐어요.',
    object: 'bed',
    icon: 'sparkles-outline',
  },
  {
    id: 'water',
    label: '물 마시기',
    before: '물 마시기를 완료하면 화분에서 꽃이 자라요.',
    after: '화분에서 꽃이 피었어요.',
    object: 'plant',
    icon: 'leaf-outline',
  },
];

type RecoveryTutorialPageProps = {
  characterId: string;
  petSpecies: PetSpecies;
  onContinue: () => void;
};

export function RecoveryTutorialPage({
  characterId,
  petSpecies,
  onContinue,
}: RecoveryTutorialPageProps) {
  const [selected, setSelected] = useState<RecoveryAction>('clean');
  const [completed, setCompleted] = useState<RecoveryAction[]>([]);
  const cleanProgress = useRef(new Animated.Value(0)).current;
  const flowerProgress = useRef(new Animated.Value(0)).current;
  const rewardProgress = useRef(new Animated.Value(0)).current;
  const action = actions.find((item) => item.id === selected) ?? actions[0];
  const cleanDone = completed.includes('clean');
  const waterDone = completed.includes('water');
  const selectedDone = completed.includes(selected);
  const allDone = cleanDone && waterDone;

  useEffect(() => {
    if (!cleanDone) {
      cleanProgress.setValue(0);
      return;
    }
    Animated.timing(cleanProgress, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [cleanDone, cleanProgress]);

  useEffect(() => {
    if (!waterDone) {
      flowerProgress.setValue(0);
      return;
    }
    Animated.spring(flowerProgress, {
      toValue: 1,
      damping: 7,
      stiffness: 90,
      mass: 0.8,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [flowerProgress, waterDone]);

  useEffect(() => {
    if (!allDone) {
      rewardProgress.setValue(0);
      return;
    }
    Animated.timing(rewardProgress, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [allDone, rewardProgress]);

  const handleAction = (id: RecoveryAction) => {
    setSelected(id);
    setCompleted((current) => current.includes(id) ? current : [...current, id]);
  };

  return (
    <View style={styles.container}>
      <TutorialRoomScene
        characterActivity={selected === 'water' ? 'plant' : 'center'}
        characterId={characterId}
        cleaned={false}
        growthLevel={0}
        highlightedObject={action.object}
        lighting="afternoon"
        petBehavior="follow"
        petSpecies={petSpecies}
      >
        <View pointerEvents="none" style={styles.heading}>
          <Text style={styles.stepLabel}>4 / 6 · 방 변화</Text>
          <Text style={styles.title}>작은 행동을 완료하면 방에도 변화가 생겨요!</Text>
          <Text style={styles.description}>
            청소와 물 마시기는 실제 기록과 별개인 온보딩 예시로만 보여드려요.
          </Text>
        </View>

        {!cleanDone ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.messyFloor,
              {
                opacity: cleanProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.86, 0],
                }),
              },
            ]}
          >
            <View style={[styles.dustPatch, styles.dustOne]} />
            <View style={[styles.dustPatch, styles.dustTwo]} />
            <View style={[styles.paperScrap, styles.paperOne]} />
            <View style={[styles.paperScrap, styles.paperTwo]} />
          </Animated.View>
        ) : null}

        {cleanDone ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cleanSparkle,
              {
                opacity: cleanProgress,
                transform: [{ scale: cleanProgress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              },
            ]}
          >
            <Text style={styles.cleanText}>쓱싹쓱싹</Text>
          </Animated.View>
        ) : null}

        {waterDone ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flower,
              {
                opacity: flowerProgress,
                transform: [
                  { translateY: flowerProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                  { scale: flowerProgress.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                ],
              },
            ]}
          >
            <View style={[styles.petal, styles.petalTop]} />
            <View style={[styles.petal, styles.petalRight]} />
            <View style={[styles.petal, styles.petalBottom]} />
            <View style={[styles.petal, styles.petalLeft]} />
            <View style={styles.flowerCenter} />
          </Animated.View>
        ) : null}

        <View style={styles.actionRow}>
          {actions.map((item) => {
            const active = item.id === selected;
            const done = completed.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => handleAction(item.id)}
                style={({ pressed }) => [
                  styles.action,
                  active && styles.actionActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons color={active ? '#FFF9EF' : '#625545'} name={item.icon} size={18} />
                <Text style={[styles.actionText, active && styles.actionTextActive]}>{item.label}</Text>
                {done ? <View style={styles.doneDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View pointerEvents="none" style={styles.changeCopy}>
          <Text style={styles.before}>{selectedDone ? action.after : action.before}</Text>
          <View style={styles.divider} />
          <Text style={styles.after}>
            미션을 완료하면 경험치와 포도를 받을 수 있어요!
          </Text>
        </View>

        {allDone ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.rewardCard,
              {
                opacity: rewardProgress,
                transform: [{ translateY: rewardProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <Text style={styles.rewardTitle}>미션 완료!</Text>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardPill}>+10 XP</Text>
              <Text style={styles.rewardPill}>+5 포도</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={styles.xpFill} />
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!allDone}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.button,
              !allDone && styles.buttonDisabled,
              pressed && allDone && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>{allDone ? '다음' : '두 행동을 모두 눌러보세요'}</Text>
          </Pressable>
        </View>
      </TutorialRoomScene>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { position: 'absolute', left: 24, right: 20, top: '5%' },
  stepLabel: { color: '#7D8963', fontSize: 10, fontWeight: '900' },
  title: { marginTop: 6, color: '#332B23', fontSize: 22, fontWeight: '900' },
  description: { marginTop: 7, color: '#6D5F4F', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  actionRow: { position: 'absolute', left: 20, right: 20, top: '24%', flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderColor: 'rgba(95,77,58,0.24)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,251,242,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionActive: { borderColor: '#6F7659', backgroundColor: '#6F7659' },
  actionText: { color: '#625545', fontSize: 10, fontWeight: '800' },
  actionTextActive: { color: '#FFF9EF' },
  doneDot: { position: 'absolute', right: 8, top: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#D9C48E' },
  messyFloor: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    bottom: '11%',
    height: '21%',
    transform: [{ rotate: '-8deg' }, { scaleY: 0.58 }],
  },
  dustPatch: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(118, 94, 64, 0.34)' },
  dustOne: { left: '11%', top: '31%', width: 86, height: 36 },
  dustTwo: { right: '10%', bottom: '20%', width: 112, height: 42 },
  paperScrap: { position: 'absolute', width: 24, height: 14, borderRadius: 2, backgroundColor: 'rgba(244, 236, 213, 0.82)' },
  paperOne: { left: '43%', top: '18%', transform: [{ rotate: '14deg' }] },
  paperTwo: { right: '29%', bottom: '12%', transform: [{ rotate: '-18deg' }] },
  cleanSparkle: { position: 'absolute', left: '35%', top: '57%', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255, 249, 230, 0.92)' },
  cleanText: { color: '#6A7257', fontSize: 11, fontWeight: '900' },
  flower: { position: 'absolute', left: '8.5%', top: '56.5%', width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  petal: { position: 'absolute', width: 14, height: 17, borderRadius: 10, backgroundColor: '#EFA1B0' },
  petalTop: { top: 0 },
  petalRight: { right: 0, transform: [{ rotate: '55deg' }] },
  petalBottom: { bottom: 0, transform: [{ rotate: '180deg' }] },
  petalLeft: { left: 0, transform: [{ rotate: '-55deg' }] },
  flowerCenter: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F4D56E' },
  changeCopy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 147,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderLeftWidth: 2,
    borderColor: '#8C9572',
    backgroundColor: 'rgba(255,252,245,0.9)',
  },
  before: { color: '#463B30', fontSize: 11, lineHeight: 17, fontWeight: '900' },
  divider: { height: 1, marginVertical: 7, backgroundColor: 'rgba(88,72,55,0.13)' },
  after: { color: '#7F6D58', fontSize: 10, lineHeight: 16, fontWeight: '800' },
  rewardCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 85,
    padding: 11,
    borderRadius: 17,
    backgroundColor: 'rgba(248, 242, 232, 0.94)',
  },
  rewardTitle: { color: '#3C3229', fontSize: 12, fontWeight: '900' },
  rewardRow: { marginTop: 7, flexDirection: 'row', gap: 8 },
  rewardPill: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, color: '#FFF9EF', fontSize: 10, fontWeight: '900', backgroundColor: '#765E8B' },
  xpTrack: { marginTop: 8, height: 6, borderRadius: 999, overflow: 'hidden', backgroundColor: '#E0D6C9' },
  xpFill: { width: '68%', height: '100%', backgroundColor: '#7D8963' },
  footer: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  button: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#695848' },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#FFF9EE', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.84 },
});
