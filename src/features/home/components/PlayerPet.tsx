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

export function PlayerPet({ activity, isInteracting, sceneSize }: PlayerPetProps) {
  const { profile } = useOnboarding();
  const pet = getPetOption(profile.petSpecies);
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const reaction = useRef(new Animated.Value(0)).current;
  const [facing, setFacing] = useState<1 | -1>(1);
  const previousTarget = useRef(petAnchors[activity].x);

  const petSize = useMemo(
    () => ({
      width: sceneSize.width * 0.235,
      height: sceneSize.height * 0.155,
    }),
    [sceneSize.height, sceneSize.width],
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(reaction, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 0,
          duration: 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 1,
          duration: 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(reaction, {
          toValue: 0,
          duration: 320,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(2600),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [reaction]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const anchor = petAnchors[activity];
    const targetX = anchor.x * sceneSize.width - petSize.width / 2;
    const targetY = anchor.y * sceneSize.height - petSize.height;
    setFacing(anchor.x >= previousTarget.current ? 1 : -1);
    previousTarget.current = anchor.x;

    const movement = Animated.parallel([
      Animated.timing(x, {
        toValue: targetX,
        duration: isInteracting ? 980 : 2850,
        delay: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(y, {
        toValue: targetY,
        duration: isInteracting ? 980 : 2850,
        delay: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    movement.start();
    return () => movement.stop();
  }, [activity, isInteracting, petSize.height, petSize.width, sceneSize.height, sceneSize.width, x, y]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const anchor = petAnchors[activity];
    x.setValue(anchor.x * sceneSize.width - petSize.width / 2);
    y.setValue(anchor.y * sceneSize.height - petSize.height);
    // Initial placement only; subsequent activity changes follow the character.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneSize.height, sceneSize.width]);

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
                outputRange: ['-1deg', '3deg'],
              }),
            },
            {
              translateY: reaction.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3],
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
