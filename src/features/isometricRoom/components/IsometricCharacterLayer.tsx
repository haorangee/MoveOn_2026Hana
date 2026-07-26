import { Image, StyleSheet, View } from 'react-native';
import { getMvpCharacterCatalogItem } from '@/features/customization/catalogs/characterCatalog';
import { isometricCharacterLayout } from '../constants/isometricRoomLayout';

type IsometricCharacterLayerProps = {
  characterId: string | null;
};

export function IsometricCharacterLayer({ characterId }: IsometricCharacterLayerProps) {
  const character = getMvpCharacterCatalogItem(characterId);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: isometricCharacterLayout.x,
          top: isometricCharacterLayout.y,
          width: isometricCharacterLayout.width,
          height: isometricCharacterLayout.height,
          zIndex: isometricCharacterLayout.zIndex,
        },
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
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
});
