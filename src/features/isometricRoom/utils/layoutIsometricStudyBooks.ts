import {
  getStudyCategory,
  type StudyBook,
  type StudyBookCategoryId,
} from '@/features/home/studyBooks';
import { isometricStudyShelfRows } from '../constants/isometricRoomLayout';
import type { IsometricStudyBookVisual } from '../types/isometricRoom';

const BOOK_GAP = 2;
const MAX_VISIBLE_BOOKS = isometricStudyShelfRows.reduce(
  (total, row) => total + row.maxBooks,
  0,
);

export function getMaxVisibleIsometricStudyBooks() {
  return MAX_VISIBLE_BOOKS;
}

export function sortStudyBooksForIsometricShelf(books: StudyBook[]) {
  return books
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createIsometricStudyBookVisuals(
  books: StudyBook[],
): IsometricStudyBookVisual[] {
  const sortedBooks = sortStudyBooksForIsometricShelf(books).slice(0, MAX_VISIBLE_BOOKS);
  const visuals: IsometricStudyBookVisual[] = [];
  let bookIndex = 0;

  for (const row of isometricStudyShelfRows) {
    let cursorX = row.x;

    for (let rowIndex = 0; rowIndex < row.maxBooks && bookIndex < sortedBooks.length; rowIndex += 1) {
      const book = sortedBooks[bookIndex];
      const width = getBookSpineWidth(book.minutes);
      const height = getBookSpineHeight(book.minutes, book.completedPages);

      if (cursorX + width > row.x + row.width) {
        break;
      }

      const category = getStudyCategory(book.categoryId);
      visuals.push({
        id: book.id,
        categoryId: book.categoryId,
        color: category.color,
        colorDark: category.colorDark,
        rowId: row.id,
        x: cursorX,
        y: row.y + row.height - height,
        width,
        height,
        rotation: getBookRotation(book.id),
      });

      cursorX += width + BOOK_GAP;
      bookIndex += 1;
    }
  }

  return visuals;
}

export function createPreviewIsometricStudyBooks(count: number): IsometricStudyBookVisual[] {
  const categories: StudyBookCategoryId[] = [
    'coding',
    'startup',
    'toeic',
    'reading',
    'school',
    'license',
    'club',
    'free',
  ];

  const previewBooks: StudyBook[] = Array.from({ length: count }, (_, index) => ({
    id: `preview-study-book-${index}`,
    categoryId: categories[index % categories.length],
    title: `preview-${index}`,
    minutes: 35 + index * 22,
    completedPages: 1 + (index % 5),
    createdAt: new Date(Date.UTC(2026, 6, 27, 0, count - index, 0)).toISOString(),
  }));

  return createIsometricStudyBookVisuals(previewBooks);
}

function getBookSpineWidth(minutes: number) {
  const normalized = Math.min(Math.max(minutes, 20), 210);
  return 5 + Math.round(((normalized - 20) / 190) * 5);
}

function getBookSpineHeight(minutes: number, completedPages: number) {
  const normalizedMinutes = Math.min(Math.max(minutes, 20), 210);
  const minuteHeight = 18 + Math.round(((normalizedMinutes - 20) / 190) * 8);
  const pageBonus = Math.min(Math.max(completedPages, 0), 6);
  return Math.min(29, minuteHeight + pageBonus);
}

function getBookRotation(id: string): `${number}deg` {
  const hash = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const rotation = (hash % 5) - 2;
  return `${rotation}deg`;
}
