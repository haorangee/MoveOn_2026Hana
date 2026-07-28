import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { getMvpCharacterCatalogItem } from '@/features/customization/catalogs/characterCatalog';
import type { MvpCharacterId } from '@/features/customization/types/customization';
import {
  isometricCharacterAnchor,
  isometricCharacterLayout,
} from '../constants/isometricRoomLayout';
import type {
  IsometricCharacterFacingDirection,
  IsometricCharacterPosition,
} from '../types/isometricRoom';

export interface IsometricCharacterLayerProps {
  characterId: MvpCharacterId | null;
  position?: IsometricCharacterPosition;
  facingDirection?: IsometricCharacterFacingDirection;
  isMoving?: boolean;
}

export function IsometricCharacterLayer({
  characterId,
  facingDirection = 'right',
  isMoving = false,
  position,
}: IsometricCharacterLayerProps) {
  const character = getMvpCharacterCatalogItem(characterId);
  const walkingBob = useRef(new Animated.Value(0)).current;
  const targetPosition = position ?? isometricCharacterAnchor;
  const translateX = targetPosition.x - isometricCharacterAnchor.x;
  const translateY = targetPosition.y - isometricCharacterAnchor.y;

  useEffect(() => {
    if (!isMoving) {
      walkingBob.stopAnimation();
      const settleAnimation = Animated.timing(walkingBob, {
        toValue: 0,
        duration: 70,
        useNativeDriver: Platform.OS !== 'web',
      });
      settleAnimation.start();
      return () => settleAnimation.stop();
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(walkingBob, {
          toValue: -2,
          duration: 70,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(walkingBob, {
          toValue: 0,
          duration: 70,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isMoving, walkingBob]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: isometricCharacterLayout.x,
          top: isometricCharacterLayout.y,
          width: isometricCharacterLayout.width,
          height: isometricCharacterLayout.height,
          zIndex: isometricCharacterLayout.zIndex,
          transform: [
            { translateX },
            { translateY },
            { translateY: walkingBob },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.facingLayer,
          { transform: [{ scaleX: facingDirection === 'left' ? -1 : 1 }] },
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={character.displayName}
          resizeMode="contain"
          source={character.source}
          style={styles.artwork}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  facingLayer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  artwork: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
