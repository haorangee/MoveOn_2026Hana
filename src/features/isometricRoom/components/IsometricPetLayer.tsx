import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import { getMvpPetCatalogItem } from '@/features/customization/catalogs/petCatalog';
import { ISOMETRIC_PET_ESCAPE_ANIMATION_MS } from '../constants/isometricMovementLayout';
import {
  isometricPetAnchor,
  isometricPetLayout,
} from '../constants/isometricRoomLayout';
import type { IsometricPetPosition } from '../types/isometricRoom';

type IsometricPetLayerProps = {
  petId: string | null;
  position?: IsometricPetPosition;
  petSpecies: string | null;
};

export function IsometricPetLayer({
  petId,
  petSpecies,
  position,
}: IsometricPetLayerProps) {
  const pet = getMvpPetCatalogItem(petId, petSpecies);
  const movement = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const targetPosition = position ?? isometricPetAnchor;
  const translateX = targetPosition.x - isometricPetAnchor.x;
  const translateY = targetPosition.y - isometricPetAnchor.y;

  useEffect(() => {
    const animation = Animated.timing(movement, {
      toValue: { x: translateX, y: translateY },
      duration: ISOMETRIC_PET_ESCAPE_ANIMATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [movement, translateX, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: isometricPetLayout.x,
          top: isometricPetLayout.y,
          width: isometricPetLayout.width,
          height: isometricPetLayout.height,
          zIndex: isometricPetLayout.zIndex,
          transform: [
            { translateX: movement.x },
            { translateY: movement.y },
          ],
        },
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={pet.displayName}
        resizeMode="contain"
        source={pet.source}
        style={styles.artwork}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  artwork: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
