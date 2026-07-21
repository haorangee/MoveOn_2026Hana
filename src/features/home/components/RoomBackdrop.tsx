import { Asset } from 'expo-asset';
import { Image, Platform, StyleSheet, View } from 'react-native';

const roomImage = require('../../../../assets/images/room/moveon-room-home.png');

type RoomBackdropProps = {
  overlayOpacity?: number;
};

export function RoomBackdrop({ overlayOpacity = 0 }: RoomBackdropProps) {
  const source = Asset.fromModule(roomImage);

  return (
    <>
      {Platform.OS === 'web' ? (
        <View
          style={[
            styles.image,
            {
              backgroundImage: `url("${source.uri}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
            } as never,
          ]}
        />
      ) : (
        <Image source={roomImage} resizeMode="cover" style={styles.image} />
      )}
      {overlayOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.image,
            { backgroundColor: `rgba(55, 43, 32, ${overlayOpacity})` },
          ]}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
