import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet } from 'react-native';
import { getPetOption } from '@/features/onboarding/onboardingData';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import type { RoomActivity } from '@/features/home/roomData';

type SceneSize = { width: number; height: number };

export type CompanionMood = 'idle' | 'studying' | 'happy' | 'tired' | 'cheering';

type PlayerPetProps = {
  activity: RoomActivity;
  isInteracting: boolean;
  sceneSize: SceneSize;
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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export function PlayerPet({
  activity,
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

  const petSize = useMemo(
    () => ({
      width: sceneSize.width * 0.235,
      height: sceneSize.height * 0.155,
    }),
    [sceneSize.height, sceneSize.width],
  );

  useEffect(() => {
    const idleDelay = companionMood === 'studying' || companionMood === 'tired' ? 1700 : 1200;
    const restDelay = companionMood === 'happy' || companionMood === 'cheering' ? 1200 : 2600;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(idleDelay),
        Animated.timing(reaction, {
          toValue: 1,
          duration: companionMood === 'tired' ? 520 : 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 0,
          duration: companionMood === 'tired' ? 520 : 260,
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
        Animated.delay(restDelay),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [companionMood, reaction]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const characterAnchor = characterAnchors[activity];
    const offset = companionOffsets[activity];
    const petAnchorX = clamp(characterAnchor.x + offset.x, 0.13, 0.87);
    const petAnchorY = clamp(characterAnchor.y + offset.y, 0.58, 0.88);
    const targetX = clamp(
      petAnchorX * sceneSize.width - petSize.width / 2,
      sceneSize.width * 0.05,
      sceneSize.width - petSize.width - sceneSize.width * 0.04,
    );
    const targetY = clamp(
      petAnchorY * sceneSize.height - petSize.height,
      sceneSize.height * 0.42,
      sceneSize.height - petSize.height - sceneSize.height * 0.04,
    );

    setFacing(petAnchorX > characterAnchor.x ? -1 : 1);

    const movement = Animated.parallel([
      Animated.timing(x, {
        toValue: targetX,
        duration: isInteracting ? 880 : 1250,
        delay: isInteracting ? 180 : 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(y, {
        toValue: targetY,
        duration: isInteracting ? 880 : 1250,
        delay: isInteracting ? 180 : 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    movement.start();
    return () => movement.stop();
  }, [activity, isInteracting, petSize.height, petSize.width, sceneSize.height, sceneSize.width, x, y]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const characterAnchor = characterAnchors[activity];
    const offset = companionOffsets[activity];
    const petAnchorX = clamp(characterAnchor.x + offset.x, 0.13, 0.87);
    const petAnchorY = clamp(characterAnchor.y + offset.y, 0.58, 0.88);
    x.setValue(clamp(
      petAnchorX * sceneSize.width - petSize.width / 2,
      sceneSize.width * 0.05,
      sceneSize.width - petSize.width - sceneSize.width * 0.04,
    ));
    y.setValue(clamp(
      petAnchorY * sceneSize.height - petSize.height,
      sceneSize.height * 0.42,
      sceneSize.height - petSize.height - sceneSize.height * 0.04,
    ));
    setFacing(petAnchorX > characterAnchor.x ? -1 : 1);
    // Initial placement only; subsequent activity changes follow the character with delay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneSize.height, sceneSize.width]);

  const bounceHeight = companionMood === 'happy' || companionMood === 'cheering' ? -8 : -3;
  const rotation = companionMood === 'tired'
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
      <Pressable
        accessibilityLabel="마루와 대화하기"
        accessibilityRole="button"
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      >
        <Image
          accessibilityLabel={`선택한 마루 ${pet.name}`}
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
});
