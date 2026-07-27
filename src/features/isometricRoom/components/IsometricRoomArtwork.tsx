import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import {
  ROOM_DESIGN_HEIGHT,
  ROOM_DESIGN_WIDTH,
} from '../constants/isometricRoomLayout';

const ROOM_ARTWORK = require('../../../../assets/images/isometric-room/moveon-room-empty-bookshelf-v2.png') as ImageSourcePropType;

export function IsometricRoomArtwork() {
  return (
    <Image
      resizeMode="contain"
      source={ROOM_ARTWORK}
      style={styles.artwork}
    />
  );
}

const styles = StyleSheet.create({
  artwork: {
    ...StyleSheet.absoluteFillObject,
    width: ROOM_DESIGN_WIDTH,
    height: ROOM_DESIGN_HEIGHT,
  },
});
