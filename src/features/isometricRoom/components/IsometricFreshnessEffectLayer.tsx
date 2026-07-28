import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { isometricFreshnessEffectItems } from '../constants/isometricFreshnessEffectLayout';
import {
  isometricCharacterAnchor,
  isometricFreshnessEffectLayout,
} from '../constants/isometricRoomLayout';
import type {
  IsometricCharacterPosition,
  IsometricFreshnessEffectItem,
  IsometricShowerStage,
} from '../types/isometricRoom';

type IsometricFreshnessEffectLayerProps = {
  characterPosition?: IsometricCharacterPosition;
  stage: IsometricShowerStage;
};

export function IsometricFreshnessEffectLayer({
  characterPosition,
  stage,
}: IsometricFreshnessEffectLayerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const isCompleted = stage === 1;

  useEffect(() => {
    if (!isCompleted) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isCompleted, pulse]);

  if (!isCompleted) {
    return null;
  }

  const animatedStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.52, 0.88],
    }),
  };
  const offsetX = characterPosition
    ? characterPosition.x - isometricCharacterAnchor.x
    : 0;
  const offsetY = characterPosition
    ? characterPosition.y - isometricCharacterAnchor.y
    : 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        animatedStyle,
        {
          left: isometricFreshnessEffectLayout.x + offsetX,
          top: isometricFreshnessEffectLayout.y + offsetY,
          width: isometricFreshnessEffectLayout.width,
          height: isometricFreshnessEffectLayout.height,
          zIndex: isometricFreshnessEffectLayout.zIndex,
        },
      ]}
    >
      {isometricFreshnessEffectItems.map((item) => (
        <FreshnessItem item={item} key={item.id} />
      ))}
    </Animated.View>
  );
}

function FreshnessItem({ item }: { item: IsometricFreshnessEffectItem }) {
  if (item.type === 'dot') {
    return (
      <View
        style={[
          styles.baseItem,
          styles.dot,
          {
            left: item.x,
            top: item.y,
            width: item.size,
            height: item.size,
            borderRadius: item.size / 2,
            opacity: item.opacity,
          },
        ]}
      />
    );
  }

  if (item.type === 'droplet') {
    return (
      <View
        style={[
          styles.baseItem,
          styles.droplet,
          {
            left: item.x,
            top: item.y,
            width: item.size * 0.74,
            height: item.size,
            borderRadius: item.size,
            opacity: item.opacity,
            transform: [
              { rotate: item.rotation ?? '0deg' },
              { skewY: '-16deg' },
            ],
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.baseItem,
        {
          left: item.x,
          top: item.y,
          width: item.size,
          height: item.size,
          opacity: item.opacity,
          transform: item.rotation ? [{ rotate: item.rotation }] : undefined,
        },
      ]}
    >
      <View style={styles.sparkleVertical} />
      <View style={styles.sparkleHorizontal} />
      <View style={styles.sparkleCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  baseItem: {
    position: 'absolute',
  },
  sparkleVertical: {
    position: 'absolute',
    left: '43%',
    top: 0,
    bottom: 0,
    width: '14%',
    borderRadius: 999,
    backgroundColor: 'rgba(239, 250, 232, 0.96)',
  },
  sparkleHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '43%',
    height: '14%',
    borderRadius: 999,
    backgroundColor: 'rgba(239, 250, 232, 0.92)',
  },
  sparkleCore: {
    position: 'absolute',
    left: '35%',
    top: '35%',
    width: '30%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(198, 235, 226, 0.9)',
  },
  dot: {
    backgroundColor: 'rgba(200, 237, 229, 0.82)',
  },
  droplet: {
    backgroundColor: 'rgba(171, 224, 227, 0.66)',
  },
});
