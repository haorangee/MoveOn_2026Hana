import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  getStudyCategory,
  type StudyBook,
  useStudyBooks,
} from '@/features/home/studyBooks';

const maxBooksPerShelf = 5;
const maxHomeBooks = 15;

type StudyBookshelfOverlayProps = {
  openingProgress?: Animated.Value;
  disabled?: boolean;
  onOpen: () => void;
};

type ShelfBook = StudyBook & {
  shelfIndex: number;
  slotIndex: number;
};

export function StudyBookshelfOverlay({
  openingProgress,
  disabled = false,
  onOpen,
}: StudyBookshelfOverlayProps) {
  const { books } = useStudyBooks();
  const glimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(glimmer, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glimmer]);

  const visibleBooks = useMemo<ShelfBook[]>(() => books
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxHomeBooks)
    .map((book, index) => ({
      ...book,
      shelfIndex: Math.floor(index / maxBooksPerShelf),
      slotIndex: index % maxBooksPerShelf,
    })), [books]);

  const animatedStyle = openingProgress ? {
    transform: [
      {
        translateY: openingProgress.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, -5, -18],
        }),
      },
      {
        scale: openingProgress.interpolate({
          inputRange: [0, 0.18, 1],
          outputRange: [1, 1.04, 2.55],
        }),
      },
    ],
  } : undefined;

  return (
    <Animated.View style={[styles.bookshelf, animatedStyle]}>
      <Pressable
        accessibilityLabel="나의 공부 책장 열기"
        accessibilityRole="button"
        disabled={disabled}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.touchTarget,
          pressed && styles.pressed,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glimmer,
            {
              opacity: glimmer.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.16],
              }),
            },
          ]}
        />
        {[0, 1, 2].map((shelfIndex) => (
          <View key={shelfIndex} pointerEvents="none" style={styles.shelfRow}>
            {visibleBooks
              .filter((book) => book.shelfIndex === shelfIndex)
              .map((book) => (
                <AnimatedBook
                  book={book}
                  key={book.id}
                  openingProgress={openingProgress}
                />
              ))}
          </View>
        ))}
      </Pressable>
    </Animated.View>
  );
}

function AnimatedBook({
  book,
  openingProgress,
}: {
  book: ShelfBook;
  openingProgress?: Animated.Value;
}) {
  const category = getStudyCategory(book.categoryId);
  const width = 6 + ((book.minutes + book.slotIndex * 7) % 4);
  const height = 27 + ((book.completedPages + book.slotIndex) % 4) * 4;
  const animatedStyle = openingProgress ? {
    transform: [
      {
        translateY: openingProgress.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, -8, -20],
        }),
      },
      {
        translateX: openingProgress.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0, (2 - book.slotIndex) * 8, (2 - book.slotIndex) * 16],
        }),
      },
      {
        scale: openingProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.18],
        }),
      },
    ],
  } : undefined;

  return (
    <Animated.View
      style={[
        styles.book,
        {
          width,
          height,
          backgroundColor: book.slotIndex % 2 === 0 ? category.color : category.colorDark,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.spineLine} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bookshelf: {
    position: 'absolute',
    left: '55.8%',
    top: '18.6%',
    width: '18.6%',
    height: '37.5%',
  },
  touchTarget: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 7,
    paddingBottom: 6,
    justifyContent: 'space-between',
    borderRadius: 5,
  },
  pressed: {
    backgroundColor: 'rgba(255, 244, 205, 0.08)',
  },
  glimmer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    backgroundColor: '#FFF1B8',
  },
  shelfRow: {
    height: '30%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    overflow: 'hidden',
  },
  book: {
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
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
