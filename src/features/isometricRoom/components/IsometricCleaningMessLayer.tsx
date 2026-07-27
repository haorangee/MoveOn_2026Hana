import { StyleSheet, View } from 'react-native';
import { isometricCleaningMessItems } from '../constants/isometricCleaningMessLayout';
import type {
  IsometricCleaningMessItem,
  IsometricCleaningStage,
} from '../types/isometricRoom';

type IsometricCleaningMessLayerProps = {
  stage: IsometricCleaningStage;
};

export function IsometricCleaningMessLayer({ stage }: IsometricCleaningMessLayerProps) {
  const visibleItems = isometricCleaningMessItems.filter(
    (item) => item.visibleUntilStage > stage,
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.layer}>
      {visibleItems.map((item) => (
        <MessItem item={item} key={item.id} />
      ))}
    </View>
  );
}

function MessItem({ item }: { item: IsometricCleaningMessItem }) {
  if (item.type === 'dust') {
    return (
      <View
        style={[
          styles.baseItem,
          styles.dust,
          {
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex,
            transform: item.rotation ? [{ rotate: item.rotation }] : undefined,
          },
        ]}
      >
        <View style={[styles.dustDot, styles.dustDotOne]} />
        <View style={[styles.dustDot, styles.dustDotTwo]} />
        <View style={[styles.dustDot, styles.dustDotThree]} />
      </View>
    );
  }

  if (item.type === 'cloth') {
    return (
      <View
        style={[
          styles.baseItem,
          styles.cloth,
          {
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex,
            transform: item.rotation ? [{ rotate: item.rotation }] : undefined,
          },
        ]}
      >
        <View style={styles.clothFold} />
      </View>
    );
  }

  if (item.type === 'wrapper') {
    return (
      <View
        style={[
          styles.baseItem,
          styles.wrapper,
          {
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex,
            transform: item.rotation ? [{ rotate: item.rotation }] : undefined,
          },
        ]}
      >
        <View style={styles.wrapperLine} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.baseItem,
        styles.paper,
        {
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
          zIndex: item.zIndex,
          transform: item.rotation ? [{ rotate: item.rotation }] : undefined,
        },
      ]}
    >
      <View style={styles.paperLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 67,
  },
  baseItem: {
    position: 'absolute',
  },
  paper: {
    borderRadius: 2,
    borderWidth: 0.6,
    borderColor: 'rgba(174, 148, 116, 0.55)',
    backgroundColor: 'rgba(255, 248, 224, 0.92)',
    shadowColor: '#5D4634',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.2,
    elevation: 1,
  },
  paperLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: '48%',
    height: 0.8,
    borderRadius: 99,
    backgroundColor: 'rgba(155, 128, 98, 0.36)',
  },
  dust: {
    borderRadius: 999,
    backgroundColor: 'rgba(143, 121, 91, 0.16)',
  },
  dustDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(116, 94, 70, 0.28)',
  },
  dustDotOne: {
    left: 5,
    top: 3,
  },
  dustDotTwo: {
    left: '45%',
    bottom: 2,
  },
  dustDotThree: {
    right: 5,
    top: 4,
  },
  cloth: {
    borderRadius: 8,
    borderWidth: 0.7,
    borderColor: 'rgba(132, 154, 175, 0.45)',
    backgroundColor: 'rgba(188, 207, 219, 0.86)',
  },
  clothFold: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: '46%',
    height: 1,
    borderRadius: 99,
    backgroundColor: 'rgba(103, 130, 152, 0.28)',
  },
  wrapper: {
    borderRadius: 4,
    borderWidth: 0.6,
    borderColor: 'rgba(195, 145, 101, 0.45)',
    backgroundColor: 'rgba(236, 186, 121, 0.88)',
  },
  wrapperLine: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: '50%',
    height: 1,
    borderRadius: 99,
    backgroundColor: 'rgba(153, 103, 70, 0.34)',
  },
});
