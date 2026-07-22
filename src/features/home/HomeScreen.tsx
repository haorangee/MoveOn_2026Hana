import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
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
    }, 1350);
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.container}>
      <RoomScene
        focusedObject={focusedObject}
        onObjectPress={handleObjectPress}
        onSettingsPress={handleSettingsPress}
        systemMessage={systemMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4EDE1' },
});
