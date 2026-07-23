import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

const messyFloorImage = require('../../../../assets/messy-floor-layer-anime.png');
const CLEANING_STORAGE_KEY = '@moveon/room-cleaning/v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const CLEANING_INTERVAL_DAYS = 1;

function isFloorMessy(lastCleanedAt: number | null, now = Date.now()) {
  if (!lastCleanedAt) return true;
  return now - lastCleanedAt >= CLEANING_INTERVAL_DAYS * DAY_MS;
}

type CleaningLayerProps = {
  disabled?: boolean;
};

export function CleaningLayer({ disabled = false }: CleaningLayerProps) {
  const [isMessy, setIsMessy] = useState(true);
  const floorOpacity = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    let active = true;

    async function hydrateCleaningState() {
      try {
        const savedValue = await AsyncStorage.getItem(CLEANING_STORAGE_KEY);
        const lastCleanedAt = savedValue ? Number(savedValue) : null;
        if (!active) return;
        const nextIsMessy = isFloorMessy(Number.isFinite(lastCleanedAt) ? lastCleanedAt : null);
        setIsMessy(nextIsMessy);
        floorOpacity.setValue(nextIsMessy ? 1 : 0);
      } catch {
        if (active) {
          setIsMessy(true);
          floorOpacity.setValue(1);
        }
      }
    }

    void hydrateCleaningState();
    return () => {
      active = false;
    };
  }, [floorOpacity]);

  if (!isMessy) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.messyFloor,
        { opacity: floorOpacity, transform: [{ scale: disabled ? 1.02 : 1.08 }, { rotate: '-8deg' }] },
      ]}
    >
      <Image contentFit="contain" source={messyFloorImage} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messyFloor: {
    position: 'absolute',
    left: '10%',
    right: '5%',
    bottom: '5%',
    height: '34%',
    opacity: 0.92,
  },
});
