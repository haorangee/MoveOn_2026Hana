import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { theme } from '@/shared/theme';
const icons = { index: 'home-outline', study: 'timer-outline', room: 'bed-outline', story: 'book-outline' } as const;
export default function TabLayout() {
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: theme.colors.primary, tabBarInactiveTintColor: theme.colors.muted,
    tabBarStyle: { height: 66, paddingTop: 7, paddingBottom: 8, backgroundColor: theme.colors.surface },
    tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name as keyof typeof icons]} color={color} size={size} />,
  })}>
    <Tabs.Screen
      name="index"
      options={{ title: '홈', tabBarStyle: { display: 'none' } }}
    />
    <Tabs.Screen name="study" options={{ title: '공부' }} />
    <Tabs.Screen name="room" options={{ title: '방' }} />
    <Tabs.Screen name="story" options={{ title: '스토리' }} />
  </Tabs>;
}
