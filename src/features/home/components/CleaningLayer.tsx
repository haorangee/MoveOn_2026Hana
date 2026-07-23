import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const messyFloorImage = require('../../../../assets/messy-floor-layer-anime.png');
const broomImage = require('../../../../assets/broom-cleaning.png');

export const CLEANING_INTERVAL_DAYS = 1; // MVP: 1일, 정식 버전: 2일

const CLEANING_STORAGE_KEY = '@moveon/room-cleaning/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

function isFloorMessy(lastCleanedAt: number | null, now = Date.now()) {
  if (!lastCleanedAt) return true;
  return now - lastCleanedAt >= CLEANING_INTERVAL_DAYS * DAY_MS;
}

type CleaningLayerProps = {
  disabled?: boolean;
};

export function CleaningLayer({ disabled = false }: CleaningLayerProps) {
  const [isMessy, setIsMessy] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const floorOpacity = useRef(new Animated.Value(1)).current;
  const broomSweep = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!isMessy || isCleaning) return undefined;
    const idleSweep = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(broomSweep, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(broomSweep, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    idleSweep.start();
    return () => idleSweep.stop();
  }, [broomSweep, isCleaning, isMessy]);

  const startCleaning = useCallback(async () => {
    if (isCleaning) return;

    setShowConfirm(false);
    setIsCleaning(true);
    broomSweep.setValue(0);

    const sweepAnimation = Animated.sequence([
      Animated.timing(broomSweep, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(broomSweep, {
        toValue: 0,
        duration: 340,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(broomSweep, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);

    const fadeAnimation = Animated.timing(floorOpacity, {
      toValue: 0,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });

    Animated.parallel([sweepAnimation, fadeAnimation]).start(async ({ finished }) => {
      if (!finished) {
        setIsCleaning(false);
        return;
      }

      const cleanedAt = Date.now();
      setIsMessy(false);
      setIsCleaning(false);
      try {
        await AsyncStorage.setItem(CLEANING_STORAGE_KEY, String(cleanedAt));
      } catch {
        // 로컬 저장 실패 시에도 현재 화면에서는 청소 완료 상태를 유지합니다.
      }
    });
  }, [broomSweep, floorOpacity, isCleaning]);

  const canPressBroom = !disabled && !isCleaning;

  return (
    <>
      {isMessy ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.messyFloor, { opacity: floorOpacity }]}
        >
          <Image contentFit="contain" source={messyFloorImage} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}

      <Animated.View
          style={[
            styles.broomStage,
            {
              transform: [
                {
                  translateX: broomSweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -18],
                  }),
                },
                {
                  translateY: broomSweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
                {
                  rotate: broomSweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['18deg', '31deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityHint="방 청소 확인창을 엽니다."
            accessibilityLabel="방 청소 빗자루"
            accessibilityRole="button"
            disabled={!canPressBroom}
            hitSlop={18}
            onPress={() => setShowConfirm(true)}
            style={({ pressed }) => [
              styles.broomTouchArea,
              pressed && styles.pressed,
              isCleaning && styles.disabled,
            ]}
          >
            <Image
              contentFit="contain"
              pointerEvents="none"
              source={broomImage}
              style={styles.broomImage}
            />
          </Pressable>
      </Animated.View>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          if (!isCleaning) setShowConfirm(false);
        }}
        transparent
        visible={showConfirm}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>방을 청소할까요?</Text>
            <Text style={styles.modalDescription}>청소하면 더러워진 바닥이 깨끗해져요.</Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isCleaning}
                onPress={() => setShowConfirm(false)}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isCleaning}
                onPress={() => void startCleaning()}
                style={({ pressed }) => [styles.cleanButton, pressed && styles.pressed]}
              >
                <Text style={styles.cleanText}>청소하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    transform: [{ rotate: '-8deg' }, { scaleX: 1.08 }, { scaleY: 0.76 }],
  },
  broomStage: {
    position: 'absolute',
    right: '3%',
    top: '58%',
    width: 50,
    height: 100,
    zIndex: 18,
    elevation: 18,
  },
  broomTouchArea: {
    position: 'absolute',
    left: '-36%',
    top: '-14%',
    right: '-28%',
    bottom: '-12%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broomImage: {
    width: '100%',
    height: '100%',
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.58 },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(38, 31, 25, 0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6D9C8',
    backgroundColor: '#FFF9EF',
    shadowColor: '#2E261E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalTitle: { color: '#382F27', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  modalDescription: { marginTop: 8, color: '#756757', fontSize: 12, lineHeight: 19, fontWeight: '700' },
  modalActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8CBBB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
  },
  cleanButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D8D62',
  },
  cancelText: { color: '#6C5E50', fontSize: 13, fontWeight: '900' },
  cleanText: { color: '#FFF9EF', fontSize: 13, fontWeight: '900' },
});
