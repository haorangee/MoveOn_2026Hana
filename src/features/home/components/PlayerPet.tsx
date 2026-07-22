import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import { getPetOption } from '@/features/onboarding/onboardingData';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import type { RoomActivity } from '@/features/home/roomData';

type SceneSize = { width: number; height: number };

type PlayerPetProps = {
  activity: RoomActivity;
  isInteracting: boolean;
  sceneSize: SceneSize;
};

const petAnchors: Record<RoomActivity, { x: number; y: number }> = {
  desk: { x: 0.29, y: 0.7 },
  bookshelf: { x: 0.53, y: 0.69 },
  window: { x: 0.28, y: 0.68 },
  bed: { x: 0.61, y: 0.72 },
  plant: { x: 0.31, y: 0.79 },
  bathroom: { x: 0.26, y: 0.72 },
  walking: { x: 0.36, y: 0.82 },
};

const hamsterRoamAnchors = [
  { x: 0.16, y: 0.82 },
  { x: 0.36, y: 0.87 },
  { x: 0.58, y: 0.78 },
  { x: 0.7, y: 0.82 },
  { x: 0.43, y: 0.75 },
] as const;

export function PlayerPet({ activity, isInteracting, sceneSize }: PlayerPetProps) {
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
  const resolvedAnchor = useMemo(
    () => isHamster ? hamsterRoamAnchors[roamIndex] : petAnchors[activity],
    [activity, isHamster, roamIndex],
  );
  const previousTarget = useRef(resolvedAnchor.x);

  const petSize = useMemo(
    () => ({
      width: sceneSize.width * (isHamster ? 0.17 : 0.235),
      height: sceneSize.height * (isHamster ? 0.11 : 0.155),
    }),
    [isHamster, sceneSize.height, sceneSize.width],
  );

  useEffect(() => {
    if (!isHamster) return;
    const roamCycle = setInterval(() => {
      setRoamIndex((current) => {
        const step = Math.random() > 0.35 ? 1 : 2;
        return (current + step) % hamsterRoamAnchors.length;
      });
    }, 4600);
    return () => clearInterval(roamCycle);
  }, [isHamster]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(reaction, {
          toValue: 1,
          duration: isHamster ? 170 : 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 0,
          duration: isHamster ? 170 : 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 1,
          duration: isHamster ? 170 : 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 0,
          duration: isHamster ? 220 : 320,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(isHamster ? 1600 : 2600),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isHamster, reaction]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const anchor = resolvedAnchor;
    const targetX = anchor.x * sceneSize.width - petSize.width / 2;
    const targetY = anchor.y * sceneSize.height - petSize.height;
    setFacing(anchor.x >= previousTarget.current ? 1 : -1);
    previousTarget.current = anchor.x;

    const movement = Animated.parallel([
      Animated.timing(x, {
        toValue: targetX,
        duration: isHamster ? 1750 : isInteracting ? 980 : 2850,
        delay: isHamster ? 80 : 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(y, {
        toValue: targetY,
        duration: isHamster ? 1750 : isInteracting ? 980 : 2850,
        delay: isHamster ? 80 : 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    movement.start();
    return () => movement.stop();
  }, [isHamster, isInteracting, petSize.height, petSize.width, resolvedAnchor, sceneSize.height, sceneSize.width, x, y]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const anchor = resolvedAnchor;
    x.setValue(anchor.x * sceneSize.width - petSize.width / 2);
    y.setValue(anchor.y * sceneSize.height - petSize.height);
    // Initial placement only; subsequent activity changes follow the character.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Initial placement only; later hamster roam changes use the movement animation above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHamster, sceneSize.height, sceneSize.width]);

  return (
    <Animated.View
      pointerEvents="none"
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
                outputRange: [isHamster ? '-3deg' : '-1deg', isHamster ? '4deg' : '3deg'],
              }),
            },
            {
              translateY: reaction.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isHamster ? -2 : -3],
              }),
            },
          ],
        },
      ]}
    >
      <Image
        accessibilityLabel={`선택한 펫 ${pet.name}`}
        contentFit="contain"
        source={pet.image}
        style={StyleSheet.absoluteFill}
      />
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
