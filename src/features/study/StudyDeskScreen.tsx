import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoomBackdrop } from '@/features/home/components/RoomBackdrop';

const studyCategories = [
  { id: 'coding', label: '코딩 공부', color: '#7696B8' },
  { id: 'language', label: '어학 공부', color: '#D69AA6' },
  { id: 'startup', label: '창업 활동', color: '#809878' },
  { id: 'club', label: '동아리 활동', color: '#D8B96F' },
  { id: 'license', label: '자격증 공부', color: '#9785AB' },
  { id: 'school', label: '학교 공부', color: '#87B6C8' },
  { id: 'reading', label: '독서', color: '#98745A' },
  { id: 'free', label: '자유 활동', color: '#8C8C84' },
];

export function StudyDeskScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(studyCategories[0]);
  const [isStarted, setIsStarted] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 18,
      stiffness: 90,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrance]);

  return (
    <View style={styles.container}>
      <RoomBackdrop overlayOpacity={0.17} />
      <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="내 방으로 돌아가기"
              onPress={() => router.back()}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={23} color="#41372E" />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>책상에 앉았어요</Text>
              <Text style={styles.headerTitle}>오늘은 무엇을 쌓아볼까요?</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.panel,
              {
                opacity: entrance,
                transform: [{
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  }),
                }],
              },
            ]}
          >
            {isStarted ? (
              <View style={styles.focusState}>
                <Text style={styles.focusLabel}>공부 중</Text>
                <Text style={styles.focusTime}>00:00:01</Text>
                <Text style={styles.focusCategory}>{selectedCategory.label}</Text>
                <View style={styles.bookProgress}>
                  <View style={[styles.bookPage, { backgroundColor: selectedCategory.color }]} />
                  <View style={styles.bookPage} />
                  <View style={styles.bookPage} />
                  <View style={styles.bookPage} />
                  <View style={styles.bookPage} />
                  <View style={styles.bookPage} />
                </View>
                <Text style={styles.focusHint}>
                  10분이 쌓이면 새로운 페이지가 생겨요.
                </Text>
                <Pressable
                  onPress={() => setIsStarted(false)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryLabel}>프로토타입 종료</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelEyebrow}>ACTIVITY</Text>
                    <Text style={styles.panelTitle}>활동 주제 선택</Text>
                  </View>
                  <Text style={styles.pageReward}>60분 · 책 1권</Text>
                </View>

                <View style={styles.categoryGrid}>
                  {studyCategories.map((category) => {
                    const selected = category.id === selectedCategory.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setSelectedCategory(category)}
                        style={[
                          styles.category,
                          selected && {
                            borderColor: category.color,
                            backgroundColor: `${category.color}20`,
                          },
                        ]}
                      >
                        <View
                          style={[styles.categoryDot, { backgroundColor: category.color }]}
                        />
                        <Text style={styles.categoryLabel}>{category.label}</Text>
                        {selected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={17}
                            color={category.color}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => setIsStarted(true)}
                  style={({ pressed }) => [
                    styles.startButton,
                    { backgroundColor: selectedCategory.color },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.startLabel}>집중 시작</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </>
            )}
          </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE3D5',
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 244, 0.93)',
  },
  headerCopy: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 252, 244, 0.91)',
  },
  eyebrow: {
    color: '#91806E',
    fontSize: 10,
    fontWeight: '700',
  },
  headerTitle: {
    marginTop: 2,
    color: '#3C332B',
    fontSize: 14,
    fontWeight: '800',
  },
  panel: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 252, 246, 0.97)',
    shadowColor: '#33271D',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 14,
  },
  panelHeading: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  panelEyebrow: {
    color: '#A08C75',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  panelTitle: {
    marginTop: 3,
    color: '#382F28',
    fontSize: 21,
    fontWeight: '900',
  },
  pageReward: {
    color: '#7E705F',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  category: {
    width: '48.8%',
    minHeight: 45,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5DBCD',
    backgroundColor: '#FFFEFA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  categoryLabel: {
    flex: 1,
    color: '#554A3F',
    fontSize: 12,
    fontWeight: '700',
  },
  startButton: {
    minHeight: 52,
    marginTop: 17,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  startLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  focusState: {
    alignItems: 'center',
  },
  focusLabel: {
    color: '#8D7B68',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  focusTime: {
    marginTop: 8,
    color: '#382F28',
    fontSize: 39,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  focusCategory: {
    marginTop: 4,
    color: '#6F6254',
    fontSize: 13,
    fontWeight: '800',
  },
  bookProgress: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 6,
  },
  bookPage: {
    width: 34,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5DDD2',
  },
  focusHint: {
    marginTop: 13,
    color: '#8D8072',
    fontSize: 11,
  },
  secondaryButton: {
    marginTop: 22,
    minHeight: 46,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCD0C1',
  },
  secondaryLabel: {
    color: '#6D6053',
    fontSize: 13,
    fontWeight: '800',
  },
});
