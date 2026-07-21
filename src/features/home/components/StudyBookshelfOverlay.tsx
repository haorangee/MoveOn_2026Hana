import { StyleSheet, View } from 'react-native';
import { getBookCount, studyCategories } from '@/features/home/studyBooks';

export function StudyBookshelfOverlay() {
  return (
    <View
      accessibilityLabel="공부 기록이 색깔별 책으로 쌓인 책장"
      pointerEvents="none"
      style={styles.bookshelf}
    >
      {studyCategories.map((category, categoryIndex) => (
        <View key={category.id} style={styles.shelfRow}>
          <View style={styles.books}>
            {Array.from({ length: getBookCount(category.minutes) }).map((_, index) => {
              const width = 5 + ((category.minutes + index * 13) % 5);
              const height = 26 + ((index + categoryIndex) % 3) * 5;

              return (
                <View
                  key={`${category.id}-${index}`}
                  style={[
                    styles.book,
                    {
                      width,
                      height,
                      backgroundColor: index % 2 === 0 ? category.color : category.colorDark,
                    },
                  ]}
                >
                  <View style={styles.spineLine} />
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bookshelf: {
    position: 'absolute',
    left: '56.3%',
    top: '21.3%',
    width: '16.7%',
    height: '24.4%',
    justifyContent: 'space-between',
    transform: [{ perspective: 600 }, { rotateY: '-1deg' }],
  },
  shelfRow: {
    height: '23%',
    justifyContent: 'flex-end',
  },
  books: {
    height: '90%',
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  book: {
    minWidth: 4,
    maxHeight: '100%',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(55, 43, 33, 0.24)',
    shadowColor: '#2E2119',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
  },
  spineLine: {
    height: 1,
    marginTop: 4,
    marginHorizontal: 1,
    backgroundColor: 'rgba(250, 238, 211, 0.5)',
  },
});
