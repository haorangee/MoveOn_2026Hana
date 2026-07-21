import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import { getCharacterOption } from '@/features/onboarding/onboardingData';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import type { RoomActivity } from '@/features/home/roomData';

type SceneSize = { width: number; height: number };

type PlayerCharacterProps = {
  activity: RoomActivity;
  isInteracting: boolean;
  sceneSize: SceneSize;
};

const activityAnchors: Record<RoomActivity, { x: number; y: number }> = {
  desk: { x: 0.42, y: 0.72 },
  bookshelf: { x: 0.64, y: 0.68 },
  window: { x: 0.39, y: 0.66 },
  bed: { x: 0.75, y: 0.73 },
  plant: { x: 0.2, y: 0.78 },
  bathroom: { x: 0.17, y: 0.7 },
  walking: { x: 0.48, y: 0.79 },
};

export function PlayerCharacter({ activity, isInteracting, sceneSize }: PlayerCharacterProps) {
  const { profile } = useOnboarding();
  const character = getCharacterOption(profile.characterId);
  const initialAnchor = activityAnchors[activity];
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const step = useRef(new Animated.Value(0)).current;
  const [facing, setFacing] = useState<1 | -1>(1);
  const [isWalking, setIsWalking] = useState(false);
  const previousTarget = useRef(initialAnchor.x);

  const characterSize = useMemo(
    () => ({
      width: sceneSize.width * 0.365,
      height: sceneSize.height * 0.34,
    }),
    [sceneSize.height, sceneSize.width],
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(step, {
          toValue: 1,
          duration: isWalking ? 360 : 1850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(step, {
          toValue: 0,
          duration: isWalking ? 360 : 1850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isWalking, step]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const anchor = activityAnchors[activity];
    const targetX = anchor.x * sceneSize.width - characterSize.width / 2;
    const targetY = anchor.y * sceneSize.height - characterSize.height;

    setFacing(anchor.x >= previousTarget.current ? 1 : -1);
    previousTarget.current = anchor.x;
    setIsWalking(true);

    const movement = Animated.parallel([
      Animated.timing(x, {
        toValue: targetX,
        duration: isInteracting ? 1150 : 3200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(y, {
        toValue: targetY,
        duration: isInteracting ? 1150 : 3200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);

    movement.start(({ finished }) => {
      if (finished) setIsWalking(false);
    });

    return () => movement.stop();
  }, [activity, characterSize.height, characterSize.width, isInteracting, sceneSize.height, sceneSize.width, x, y]);

  useEffect(() => {
    if (sceneSize.width === 0 || sceneSize.height === 0) return;
    const anchor = activityAnchors[activity];
    x.setValue(anchor.x * sceneSize.width - characterSize.width / 2);
    y.setValue(anchor.y * sceneSize.height - characterSize.height);
    // Initial placement only; subsequent activity changes use the walking animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneSize.height, sceneSize.width]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.characterStage,
        characterSize,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { scaleX: facing },
            {
              translateY: step.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isWalking ? -5 : -2],
              }),
            },
            {
              rotate: step.interpolate({
                inputRange: [0, 1],
                outputRange: [isWalking ? '-1.3deg' : '-0.2deg', isWalking ? '1.3deg' : '0.2deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Image
        accessibilityLabel={`선택한 캐릭터 ${character.name}`}
        contentFit="contain"
        source={character.image}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  characterStage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
