import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import {
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';

export const ISOMETRIC_ROOM_ARTWORK_READY = false;

const roomArtworkSource: ImageSourcePropType | null = null;

type IsometricRoomArtworkProps = {
  assetReady?: boolean;
};

export function IsometricRoomArtwork({
  assetReady = ISOMETRIC_ROOM_ARTWORK_READY,
}: IsometricRoomArtworkProps) {
  if (assetReady && roomArtworkSource) {
    return (
      <Image
        resizeMode="contain"
        source={roomArtworkSource}
        style={styles.artwork}
      />
    );
  }

  return (
    <View style={styles.waitingFrame}>
      <View style={styles.cornerPin} />
      <Text style={styles.waitingTitle}>아이소메트릭 원룸 배경 에셋 적용 대기 중</Text>
      <Text style={styles.waitingDescription}>
        기준 크기: {ROOM_DESIGN_WIDTH} × {ROOM_DESIGN_HEIGHT}
      </Text>
      <Text style={styles.waitingHint}>
        고정 가구 포함 배경 이미지가 필요합니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  artwork: {
    ...StyleSheet.absoluteFillObject,
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
  },
  waitingFrame: {
    ...StyleSheet.absoluteFillObject,
    margin: 24,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E8B7C6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    backgroundColor: 'rgba(255, 246, 250, 0.72)',
  },
  cornerPin: {
    position: 'absolute',
    top: 28,
    width: 52,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 214, 140, 0.86)',
    transform: [{ rotate: '-4deg' }],
  },
  waitingTitle: {
    color: '#4A3A34',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  waitingDescription: {
    marginTop: 12,
    color: '#7C6A60',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  waitingHint: {
    marginTop: 6,
    color: '#9A8176',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
