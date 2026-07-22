import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

const STUDY_BOOKS_STORAGE_KEY = '@moveon/study-books/v1';
const bookListeners = new Set<(books: StudyBook[]) => void>();

export type StudyBookCategoryId =
  | 'coding'
  | 'startup'
  | 'toeic'
  | 'reading'
  | 'school'
  | 'license'
  | 'club'
  | 'free';

export type StudyCategory = {
  id: StudyBookCategoryId;
  label: string;
  color: string;
  colorDark: string;
};

export type StudyBook = {
  id: string;
  categoryId: StudyBookCategoryId;
  title: string;
  minutes: number;
  completedPages: number;
  createdAt: string;
};

export type StudyBookDraft = Omit<StudyBook, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

export const studyCategories: StudyCategory[] = [
  { id: 'coding', label: '코딩', color: '#6288A8', colorDark: '#466A89' },
  { id: 'startup', label: '창업', color: '#78906B', colorDark: '#576F4C' },
  { id: 'toeic', label: '토익', color: '#B7A0D8', colorDark: '#8B74B0' },
  { id: 'reading', label: '독서', color: '#9A7358', colorDark: '#76513D' },
  { id: 'school', label: '학교', color: '#87B6C8', colorDark: '#5C8FA5' },
  { id: 'license', label: '자격증', color: '#9785AB', colorDark: '#715F85' },
  { id: 'club', label: '동아리', color: '#D8B96F', colorDark: '#A9863E' },
  { id: 'free', label: '자유', color: '#8C8C84', colorDark: '#68685F' },
];

const initialBooks: StudyBook[] = [];

function notifyBookListeners(books: StudyBook[]) {
  bookListeners.forEach((listener) => listener(books));
}

export function normalizeStudyCategoryId(categoryId?: string): StudyBookCategoryId {
  if (categoryId === 'language') return 'toeic';
  if (categoryId === 'coding') return 'coding';
  if (categoryId === 'startup') return 'startup';
  if (categoryId === 'reading') return 'reading';
  if (categoryId === 'school') return 'school';
  if (categoryId === 'license') return 'license';
  if (categoryId === 'club') return 'club';
  return 'free';
}

export function getStudyCategory(categoryId: string) {
  const normalizedId = normalizeStudyCategoryId(categoryId);
  return studyCategories.find((category) => category.id === normalizedId) ?? studyCategories[0];
}

export function getBookCount(minutes: number) {
  return Math.max(1, Math.ceil(minutes / 75));
}

export function formatStudyTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

export function createStudyBookFromResult(params: {
  id?: string;
  categoryId?: string;
  categoryLabel?: string;
  elapsedSeconds?: string;
  completedPages?: string;
  endedAt?: string;
}): StudyBookDraft | null {
  const elapsedSeconds = Number(params.elapsedSeconds ?? 0);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return null;

  const categoryId = normalizeStudyCategoryId(params.categoryId);
  const category = getStudyCategory(categoryId);
  const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const completedPages = Math.max(1, Number(params.completedPages ?? 1));
  const endedAt = params.endedAt ?? new Date().toISOString();

  return {
    id: params.id ?? `book-${categoryId}-${endedAt}-${elapsedSeconds}`,
    categoryId,
    title: params.categoryLabel || category.label,
    minutes,
    completedPages,
    createdAt: endedAt,
  };
}

export function useStudyBooks() {
  const [books, setBooks] = useState<StudyBook[]>(initialBooks);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateBooks() {
      try {
        const savedBooks = await AsyncStorage.getItem(STUDY_BOOKS_STORAGE_KEY);
        if (savedBooks && isMounted) {
          const parsedBooks = JSON.parse(savedBooks) as StudyBook[];
          setBooks(parsedBooks);
        }
      } catch {
        // Keep seeded local books if storage is unavailable or corrupted.
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    void hydrateBooks();
    bookListeners.add(setBooks);

    return () => {
      isMounted = false;
      bookListeners.delete(setBooks);
    };
  }, []);

  const saveBooks = useCallback(async (nextBooks: StudyBook[]) => {
    setBooks(nextBooks);
    notifyBookListeners(nextBooks);
    await AsyncStorage.setItem(STUDY_BOOKS_STORAGE_KEY, JSON.stringify(nextBooks));
  }, []);

  const addBookOnce = useCallback(async (draft: StudyBookDraft) => {
    const nextBook: StudyBook = {
      ...draft,
      id: draft.id ?? `book-${draft.categoryId}-${draft.createdAt ?? Date.now()}`,
      createdAt: draft.createdAt ?? new Date().toISOString(),
    };

    const exists = books.some((book) => book.id === nextBook.id);
    if (exists) return nextBook;

    await saveBooks([...books, nextBook]);
    return nextBook;
  }, [books, saveBooks]);

  const categorySummaries = useMemo(() => studyCategories.map((category) => {
    const categoryBooks = books.filter((book) => book.categoryId === category.id);
    return {
      ...category,
      books: categoryBooks,
      minutes: categoryBooks.reduce((total, book) => total + book.minutes, 0),
    };
  }), [books]);

  const totalMinutes = useMemo(
    () => books.reduce((total, book) => total + book.minutes, 0),
    [books],
  );

  return {
    books,
    categorySummaries,
    totalMinutes,
    isHydrated,
    addBookOnce,
  };
}
