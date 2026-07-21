import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RoomScene } from '@/features/home/components/RoomScene';
import { ObjectInteractionSheet } from '@/features/home/components/ObjectInteractionSheet';
import type { RoomObject } from '@/features/home/roomData';

export function HomeScreen() {
  const router = useRouter();
  const [selectedObject, setSelectedObject] = useState<RoomObject | null>(null);

  const handlePrimaryAction = () => {
    if (!selectedObject) return;

    const route = selectedObject.route;
    setSelectedObject(null);

    if (route) {
      router.push(route);
    }
  };

  return (
    <View style={styles.container}>
      <RoomScene
        onObjectPress={setSelectedObject}
        onSettingsPress={() => setSelectedObject({
          id: 'settings',
          title: '설정',
          description: '알림과 화면 설정은 다음 단계에서 연결할 예정이에요.',
          actionLabel: '확인',
          icon: 'settings-outline',
        })}
      />

      <ObjectInteractionSheet
        object={selectedObject}
        onClose={() => setSelectedObject(null)}
        onPrimaryAction={handlePrimaryAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EDE1',
  },
});
