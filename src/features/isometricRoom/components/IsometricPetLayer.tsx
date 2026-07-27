import { Image, StyleSheet, View } from 'react-native';
import { getMvpPetCatalogItem } from '@/features/customization/catalogs/petCatalog';
import { isometricPetLayout } from '../constants/isometricRoomLayout';

type IsometricPetLayerProps = {
  petId: string | null;
  petSpecies: string | null;
};

export function IsometricPetLayer({ petId, petSpecies }: IsometricPetLayerProps) {
  const pet = getMvpPetCatalogItem(petId, petSpecies);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: isometricPetLayout.x,
          top: isometricPetLayout.y,
          width: isometricPetLayout.width,
          height: isometricPetLayout.height,
          zIndex: isometricPetLayout.zIndex,
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
    </View>
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
