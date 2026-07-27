import { StyleSheet, View } from 'react-native';
import { isometricWaterPlantLayout } from '../constants/isometricRoomLayout';
import type { IsometricPlantStage } from '../types/isometricRoom';

type IsometricWaterPlantLayerProps = {
  isCompleted: boolean;
  stage: IsometricPlantStage;
};

const stageScale: Record<IsometricPlantStage, number> = {
  0: 0,
  1: 0.38,
  2: 0.52,
  3: 0.68,
  4: 0.84,
  5: 1,
};

export function IsometricWaterPlantLayer({
  isCompleted,
  stage,
}: IsometricWaterPlantLayerProps) {
  if (stage <= 0) return null;

  const scale = stageScale[stage];
  const showBud = stage >= 3;
  const showFlower = stage >= 4;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: isometricWaterPlantLayout.x,
          top: isometricWaterPlantLayout.y,
          width: isometricWaterPlantLayout.width,
          height: isometricWaterPlantLayout.height,
          zIndex: isometricWaterPlantLayout.zIndex,
        },
      ]}
    >
      <View
        style={[
          styles.growthAnchor,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.stem} />
        <View style={[styles.leaf, styles.leafLeft]} />
        <View style={[styles.leaf, styles.leafRight]} />
        {stage >= 2 ? <View style={[styles.leaf, styles.leafLowerLeft]} /> : null}
        {stage >= 2 ? <View style={[styles.leaf, styles.leafLowerRight]} /> : null}
        {showBud ? <View style={styles.bud} /> : null}
        {showFlower ? (
          <View style={styles.flower}>
            <View style={[styles.petal, styles.petalTop]} />
            <View style={[styles.petal, styles.petalRight]} />
            <View style={[styles.petal, styles.petalBottom]} />
            <View style={[styles.petal, styles.petalLeft]} />
            <View style={styles.flowerCenter} />
          </View>
        ) : null}
      </View>
      {isCompleted ? (
        <View style={styles.sparkles}>
          <View style={[styles.sparkle, styles.sparkleOne]} />
          <View style={[styles.sparkle, styles.sparkleTwo]} />
          <View style={[styles.sparkle, styles.sparkleThree]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  growthAnchor: {
    position: 'absolute',
    left: 29,
    bottom: 18,
    width: 34,
    height: 72,
    alignItems: 'center',
    transformOrigin: 'bottom center',
  },
  stem: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#6EAA65',
  },
  leaf: {
    position: 'absolute',
    width: 25,
    height: 15,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#79B96A',
  },
  leafLeft: {
    left: -8,
    bottom: 28,
    transform: [{ rotate: '-24deg' }],
  },
  leafRight: {
    right: -8,
    bottom: 34,
    transform: [{ rotate: '24deg' }, { scaleX: -1 }],
  },
  leafLowerLeft: {
    left: -11,
    bottom: 14,
    width: 22,
    height: 13,
    backgroundColor: '#8AC877',
    transform: [{ rotate: '-15deg' }],
  },
  leafLowerRight: {
    right: -11,
    bottom: 18,
    width: 22,
    height: 13,
    backgroundColor: '#8AC877',
    transform: [{ rotate: '15deg' }, { scaleX: -1 }],
  },
  bud: {
    position: 'absolute',
    top: 7,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#F1B6BE',
  },
  flower: {
    position: 'absolute',
    top: -2,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    width: 13,
    height: 17,
    borderRadius: 10,
    backgroundColor: '#F4A8BB',
  },
  petalTop: { top: 0 },
  petalRight: { right: 2, transform: [{ rotate: '54deg' }] },
  petalBottom: { bottom: 0, transform: [{ rotate: '180deg' }] },
  petalLeft: { left: 2, transform: [{ rotate: '-54deg' }] },
  flowerCenter: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F8D976',
  },
  sparkles: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F8E7A6',
  },
  sparkleOne: { left: 17, top: 30 },
  sparkleTwo: { right: 20, top: 16 },
  sparkleThree: { left: 48, top: 2 },
});
