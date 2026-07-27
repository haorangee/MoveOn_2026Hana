import { useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useStudyBooks } from '@/features/home/studyBooks';
import {
  createIsometricStudyBookVisuals,
  getMaxVisibleIsometricStudyBooks,
} from '../utils/layoutIsometricStudyBooks';

export function useIsometricStudyBooksState() {
  const { books, isHydrated, totalMinutes } = useStudyBooks();

  const visibleBooks = useMemo(() => createIsometricStudyBookVisuals(books), [books]);
  const totalBookCount = books.length;
  const maxVisibleBooks = getMaxVisibleIsometricStudyBooks();

  const reload = useCallback(async () => {
    // useStudyBooks hydrates from the existing study storage and listens to
    // same-runtime updates. This hook keeps the explicit API for preview and
    // future screen focus refreshes without introducing another storage writer.
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return {
    visibleBooks,
    totalBookCount,
    totalMinutes,
    maxVisibleBooks,
    isLoading: !isHydrated,
    error: null as string | null,
    reload,
  };
}
