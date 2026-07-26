import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { vacuumCleanerLayout } from '../constants/isometricRoomLayout';

const VACUUM_CLEANER_ARTWORK = require('../../../../assets/images/isometric-room/objects/vacuum-cleaner-v1.png') as ImageSourcePropType;

export function VacuumCleanerLayer() {
  return (
    <View pointerEvents="none" style={styles.vacuumCleaner}>
      <Image
        resizeMode="contain"
        source={VACUUM_CLEANER_ARTWORK}
        style={styles.artwork}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  vacuumCleaner: {
    position: 'absolute',
    left: vacuumCleanerLayout.x,
    top: vacuumCleanerLayout.y,
    width: vacuumCleanerLayout.width,
    height: vacuumCleanerLayout.height,
    zIndex: vacuumCleanerLayout.zIndex,
    elevation: vacuumCleanerLayout.zIndex,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
});
