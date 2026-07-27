import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { ISOMETRIC_HOME_ROOM_ENABLED } from '@/features/home/constants/homeFeatureFlags';
import { IsometricHomeRoom } from '@/features/home/components/IsometricHomeRoom';
import { RoomScene } from '@/features/home/components/RoomScene';
import type { RoomHotspot } from '@/features/home/roomData';

export function HomeScreen() {
  const router = useRouter();
  const [focusedObject, setFocusedObject] = useState<RoomHotspot | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    if (messageTimer.current) clearTimeout(messageTimer.current);
  }, []);

  const handleObjectPress = (object: RoomHotspot) => {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    setSystemMessage(null);
    setFocusedObject(object);

    actionTimer.current = setTimeout(() => {
      if (object.route) {
        router.push(object.route);
        setFocusedObject(null);
        return;
      }

      actionTimer.current = setTimeout(() => setFocusedObject(null), 2600);
    }, object.id === 'bookshelf' ? 880 : 1350);
  };

  const handleSettingsPress = () => {
    router.push('/settings' as Href);
  };

  const handleCleaningVerificationPress = () => {
    router.push('/cleaning' as Href);
  };

  return (
    <View style={styles.container}>
      {ISOMETRIC_HOME_ROOM_ENABLED ? (
        <IsometricHomeRoom />
      ) : (
        <RoomScene
          focusedObject={focusedObject}
          onCleaningVerificationPress={handleCleaningVerificationPress}
          onObjectPress={handleObjectPress}
          onSettingsPress={handleSettingsPress}
          systemMessage={systemMessage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4EDE1' },
});
