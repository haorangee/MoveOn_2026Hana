import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getPetOption } from '@/features/onboarding/onboardingData';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import type { RoomActivity } from '@/features/home/roomData';

type SceneSize = { width: number; height: number };

export type CompanionMood = 'idle' | 'studying' | 'happy' | 'tired' | 'cheering';

type PlayerPetProps = {
  activity: RoomActivity;
  isInteracting: boolean;
  sceneSize: SceneSize;
  bubbleMessage?: string | null;
  companionMood?: CompanionMood;
  onPress?: () => void;
};

const characterAnchors: Record<RoomActivity, { x: number; y: number }> = {
  desk: { x: 0.42, y: 0.72 },
  bookshelf: { x: 0.64, y: 0.68 },
  window: { x: 0.39, y: 0.66 },
  bed: { x: 0.75, y: 0.73 },
  plant: { x: 0.2, y: 0.78 },
  bathroom: { x: 0.17, y: 0.7 },
  walking: { x: 0.48, y: 0.79 },
};

const companionOffsets: Record<RoomActivity, { x: number; y: number }> = {
  desk: { x: 0.13, y: 0.035 },
  bookshelf: { x: -0.13, y: 0.04 },
  window: { x: 0.12, y: 0.04 },
  bed: { x: -0.12, y: 0.045 },
  plant: { x: 0.13, y: 0.035 },
  bathroom: { x: 0.13, y: 0.04 },
  walking: { x: 0.12, y: 0.04 },
};

const hamsterRoamAnchors = [
  { x: 0.16, y: 0.82 },
  { x: 0.36, y: 0.87 },
  { x: 0.58, y: 0.78 },
  { x: 0.7, y: 0.82 },
  { x: 0.43, y: 0.75 },
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export function PlayerPet({
  activity,
  bubbleMessage,
  isInteracting,
  sceneSize,
  companionMood = 'idle',
  onPress,
}: PlayerPetProps) {
  const { profile } = useOnboarding();
  const pet = getPetOption(profile.petSpecies);
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const reaction = useRef(new Animated.Value(0)).current;
  const [facing, setFacing] = useState<1 | -1>(1);
  const [roamIndex, setRoamIndex] = useState(
    () => Math.floor(Math.random() * hamsterRoamAnchors.length),
  );
  const isHamster = pet.id === 'hamster';

  const resolvedAnchor = useMemo(() => {
    if (isHamster) return hamsterRoamAnchors[roamIndex];
    const characterAnchor = characterAnchors[activity];
    const offset = companionOffsets[activity];
    return {
      x: clamp(characterAnchor.x + offset.x, 0.13, 0.87),
      y: clamp(characterAnchor.y + offset.y, 0.58, 0.88),
    };
  }, [activity, isHamster, roamIndex]);

  const previousTarget = useRef(resolvedAnchor.x);
  const petSize = useMemo(
    () => ({
      width: sceneSize.width * (isHamster ? 0.17 : 0.235),
      height: sceneSize.height * (isHamster ? 0.11 : 0.155),
    }),
    [isHamster, sceneSize.height, sceneSize.width],
  );

  useEffect(() => {
    if (!isHamster) return undefined;
    const roamCycle = setInterval(() => {
      setRoamIndex((current) => {
        const step = Math.random() > 0.35 ? 1 : 2;
        return (current + step) % hamsterRoamAnchors.length;
      });
    }, 4600);
    return () => clearInterval(roamCycle);
  }, [isHamster]);

  useEffect(() => {
    const idleDelay = companionMood === 'studying' || companionMood === 'tired' ? 1700 : 1200;
    const restDelay = companionMood === 'happy' || companionMood === 'cheering' ? 1200 : 2600;
    const reactionDuration = isHamster ? 170 : companionMood === 'tired' ? 520 : 260;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(idleDelay),
        Animated.timing(reaction, {
          toValue: 1,
          duration: reactionDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 0,
          duration: reactionDuration,
          useNativeDriver: Platform.OS !== 'web',
        }),
        ...(companionMood === 'happy' || companionMood === 'cheering'
          ? [
              Animated.timing(reaction, {
                toValue: 1,
                duration: 240,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(reaction, {
                toValue: 0,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]
          : []),
        Animated.delay(isHamster ? 1600 : restDelay),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [companionMood, isHamster, reaction]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return undefined;
    const targetX = clamp(
      resolvedAnchor.x * sceneSize.width - petSize.width / 2,
      sceneSize.width * 0.05,
      sceneSize.width - petSize.width - sceneSize.width * 0.04,
    );
    const targetY = clamp(
      resolvedAnchor.y * sceneSize.height - petSize.height,
      sceneSize.height * 0.42,
      sceneSize.height - petSize.height - sceneSize.height * 0.04,
    );

    setFacing(resolvedAnchor.x >= previousTarget.current ? 1 : -1);
    previousTarget.current = resolvedAnchor.x;

    const movement = Animated.parallel([
      Animated.timing(x, {
        toValue: targetX,
        duration: isHamster ? 1750 : isInteracting ? 880 : 1250,
        delay: isHamster ? 80 : isInteracting ? 180 : 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(y, {
        toValue: targetY,
        duration: isHamster ? 1750 : isInteracting ? 880 : 1250,
        delay: isHamster ? 80 : isInteracting ? 180 : 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    movement.start();
    return () => movement.stop();
  }, [isHamster, isInteracting, petSize.height, petSize.width, resolvedAnchor, sceneSize.height, sceneSize.width, x, y]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    x.setValue(clamp(
      resolvedAnchor.x * sceneSize.width - petSize.width / 2,
      sceneSize.width * 0.05,
      sceneSize.width - petSize.width - sceneSize.width * 0.04,
    ));
    y.setValue(clamp(
      resolvedAnchor.y * sceneSize.height - petSize.height,
      sceneSize.height * 0.42,
      sceneSize.height - petSize.height - sceneSize.height * 0.04,
    ));
    // Initial placement only; later activity or hamster roaming uses the movement animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHamster, sceneSize.height, sceneSize.width]);

  const bounceHeight = isHamster
    ? -2
    : companionMood === 'happy' || companionMood === 'cheering'
      ? -8
      : -3;
  const rotation = isHamster
    ? ['-3deg', '4deg']
    : companionMood === 'tired'
      ? ['0deg', '-1deg']
      : companionMood === 'studying'
        ? ['-1deg', '1deg']
        : ['-1deg', '3deg'];

  return (
    <Animated.View
      pointerEvents={onPress ? 'auto' : 'none'}
      style={[
        styles.petStage,
        petSize,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { scaleX: facing },
            {
              rotate: reaction.interpolate({
                inputRange: [0, 1],
                outputRange: rotation,
              }),
            },
            {
              translateY: reaction.interpolate({
                inputRange: [0, 1],
                outputRange: [companionMood === 'tired' ? 2 : 0, bounceHeight],
              }),
            },
          ],
        },
      ]}
    >
      {bubbleMessage ? (
        <View
          pointerEvents="none"
          style={[
            styles.bubble,
            {
              left: -petSize.width * 0.38,
              width: petSize.width * 1.76,
              transform: [{ scaleX: facing }],
            },
          ]}
        >
          <Text style={styles.bubbleText}>{bubbleMessage}</Text>
          <View style={styles.bubbleTail} />
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={`${profile.petName || pet.name}와 대화하기`}
        accessibilityRole="button"
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      >
        <Image
          accessibilityLabel={`선택한 펫 ${pet.name}`}
          contentFit="contain"
          source={pet.image}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  petStage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bubble: {
    position: 'absolute',
    bottom: '88%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 252, 245, 0.94)',
    shadowColor: '#3D3428',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'web' ? 0.1 : 0.14,
    shadowRadius: 7,
    elevation: 4,
  },
  bubbleTail: {
    position: 'absolute',
    left: '50%',
    bottom: -5,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 252, 245, 0.94)',
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: {
    color: '#554A3D',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
});
