import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatStudyTime,
  getBookCount,
  studyCategories,
} from '@/features/home/studyBooks';

export function BookshelfRecordScreen() {
  const router = useRouter();
  const totalMinutes = studyCategories.reduce((total, category) => total + category.minutes, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="내 방으로 돌아가기"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={21} color="#4A4035" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY BOOKSHELF</Text>
            <Text style={styles.title}>나의 공부가 쌓인 책장</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>누적 공부 시간</Text>
          <Text style={styles.totalValue}>{formatStudyTime(totalMinutes)}</Text>
          <Text style={styles.totalHint}>책의 색은 주제, 두께는 공부 시간을 나타내요.</Text>
        </View>

        <View style={styles.shelfCase}>
          {studyCategories.map((category) => (
            <View key={category.id} style={styles.shelfSection}>
              <View style={styles.shelfLabelRow}>
                <View style={[styles.legendDot, { backgroundColor: category.color }]} />
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryTime}>{formatStudyTime(category.minutes)}</Text>
              </View>
              <View style={styles.bookRow}>
                {Array.from({ length: getBookCount(category.minutes) }).map((_, index) => (
                  <View
                    key={`${category.id}-${index}`}
                    style={[
                      styles.book,
                      {
                        width: 21 + ((category.minutes + index * 11) % 13),
                        height: 72 + (index % 3) * 10,
                        backgroundColor: index % 2 === 0 ? category.color : category.colorDark,
                      },
                    ]}
                  >
                    <View style={styles.bookRule} />
                    <Text numberOfLines={1} style={styles.bookText}>{category.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.woodShelf} />
            </View>
          ))}
        </View>

        <View style={styles.insight}>
          <Ionicons name="sparkles-outline" size={18} color="#7C7753" />
          <Text style={styles.insightText}>
            가장 많이 쌓인 책은 코딩이에요. 이번 주에도 파란 책 한 권을 더 채워볼까요?
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5EFE5' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E3D7C6',
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#94806B', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 3, color: '#392F27', fontSize: 21, fontWeight: '900' },
  totalCard: {
    marginTop: 22,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#E8DDCD',
  },
  totalLabel: { color: '#8C7967', fontSize: 12, fontWeight: '700' },
  totalValue: { marginTop: 5, color: '#3D332A', fontSize: 29, fontWeight: '900' },
  totalHint: { marginTop: 7, color: '#8D8174', fontSize: 11, lineHeight: 17 },
  shelfCase: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 22,
    borderRadius: 14,
    backgroundColor: '#876448',
    borderWidth: 5,
    borderColor: '#65472F',
    shadowColor: '#3C2B1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  shelfSection: { marginBottom: 14 },
  shelfLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  categoryLabel: { color: '#FFF4E3', fontSize: 11, fontWeight: '800' },
  categoryTime: { marginLeft: 'auto', color: '#E2CDB6', fontSize: 9, fontWeight: '700' },
  bookRow: {
    height: 102,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: '#6C4D36',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  book: {
    minWidth: 20,
    paddingVertical: 7,
    alignItems: 'center',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(48, 37, 29, 0.28)',
  },
  bookRule: { width: '78%', height: 2, backgroundColor: 'rgba(255, 241, 217, 0.55)' },
  bookText: {
    marginTop: 'auto',
    color: 'rgba(255, 249, 235, 0.82)',
    fontSize: 7,
    fontWeight: '800',
    transform: [{ rotate: '-90deg' }],
  },
  woodShelf: {
    height: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#B48964',
    borderBottomWidth: 2,
    borderBottomColor: '#523822',
  },
  insight: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EBE7D4',
  },
  insightText: { flex: 1, color: '#646047', fontSize: 12, lineHeight: 19, fontWeight: '600' },
});
