import { Asset } from 'expo-asset';
import { useEffect } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { vacuumCleanerLayouts } from '../constants/isometricRoomLayout';
import type { VacuumCleanerState } from '../types/isometricRoom';

const VACUUM_CLEANER_IDLE_ASSET = require('../../../../assets/images/isometric-room/objects/vacuum-cleaner-idle-v1.png');
const VACUUM_CLEANER_ACTIVE_ASSET = require('../../../../assets/images/isometric-room/objects/vacuum-cleaner-active-v1.png');

const VACUUM_CLEANER_ASSETS = {
  idle: VACUUM_CLEANER_IDLE_ASSET as ImageSourcePropType,
  active: VACUUM_CLEANER_ACTIVE_ASSET as ImageSourcePropType,
} as const;

let activePreloadImage: { src: string } | null = null;

type VacuumCleanerLayerProps = {
  state: VacuumCleanerState;
};

export function VacuumCleanerLayer({ state }: VacuumCleanerLayerProps) {
  const layout = vacuumCleanerLayouts[state];

  useEffect(() => {
    const activeAsset = Asset.fromModule(VACUUM_CLEANER_ACTIVE_ASSET);
    void activeAsset.downloadAsync();

    const WebImage = (
      globalThis as typeof globalThis & {
        Image?: new () => { src: string };
      }
    ).Image;
    if (Platform.OS === 'web' && WebImage) {
      activePreloadImage = new WebImage();
      activePreloadImage.src = activeAsset.uri;
    }
  }, []);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.vacuumCleaner,
        {
          left: layout.x,
          top: layout.y,
          width: layout.width,
          height: layout.height,
          zIndex: layout.zIndex,
          elevation: layout.zIndex,
          transform: [{ rotate: layout.rotation }],
        },
      ]}
    >
      <Image
        resizeMode="contain"
        source={VACUUM_CLEANER_ASSETS[state]}
        style={styles.artwork}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  vacuumCleaner: {
    position: 'absolute',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
});
