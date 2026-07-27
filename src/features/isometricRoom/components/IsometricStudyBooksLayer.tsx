import { StyleSheet, View } from 'react-native';
import type { IsometricStudyBookVisual } from '../types/isometricRoom';

type IsometricStudyBooksLayerProps = {
  books: IsometricStudyBookVisual[];
};

export function IsometricStudyBooksLayer({ books }: IsometricStudyBooksLayerProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.layer}>
      {books.map((book) => (
        <View
          key={book.id}
          style={[
            styles.book,
            {
              left: book.x,
              top: book.y,
              width: book.width,
              height: book.height,
              backgroundColor: book.color,
              borderColor: book.colorDark,
              transform: book.rotation ? [{ rotate: book.rotation }] : undefined,
            },
          ]}
        >
          <View style={[styles.bookHighlight, { backgroundColor: book.colorDark }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 64,
  },
  book: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 1.8,
    borderWidth: 0.8,
    shadowColor: '#2F2118',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 1.4,
    elevation: 1,
  },
  bookHighlight: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 4,
    height: 1.5,
    borderRadius: 999,
    opacity: 0.42,
  },
});
