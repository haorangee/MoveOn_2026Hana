import {
  type NewsActivitySummary,
  getLocalDateKey,
  normalizeNewsActivitySummary,
} from '@/contracts/moveon-news';
import { loadCleaningMissionState } from '@/features/home/cleaningMission';
import { getDisplayShowerMinutes, loadShowerDayRecord } from '@/features/home/showerMission';
import type { StudyBook } from '@/features/home/studyBooks';
import { loadWaterMissionState } from '@/features/home/waterMission';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isInDateRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

export async function loadMoveOnNewsActivitySummary(params: {
  userName?: string;
  books: StudyBook[];
  now?: Date;
}): Promise<NewsActivitySummary> {
  const now = params.now ?? new Date();
  const todayKey = getLocalDateKey(now);
  const periodEnd = todayKey;
  const periodStartDate = addDays(startOfDay(now), -6);
  const periodStart = getLocalDateKey(periodStartDate);
  const periodEndDate = new Date(startOfDay(now).getTime() + 24 * 60 * 60 * 1000 - 1);

  const weeklyBooks = params.books.filter((book) => (
    isInDateRange(book.createdAt, periodStartDate, periodEndDate)
  ));

  const [waterState, cleaningState, showerRecord] = await Promise.all([
    loadWaterMissionState(todayKey),
    loadCleaningMissionState(todayKey),
    loadShowerDayRecord(todayKey),
  ]);

  return normalizeNewsActivitySummary({
    userName: params.userName,
    periodStart,
    periodEnd,
    studyMinutes: weeklyBooks.reduce((total, book) => total + book.minutes, 0),
    studySessions: weeklyBooks.length,
    booksCreated: weeklyBooks.length,
    waterCount: waterState.cupCount,
    waterGoalCompleted: waterState.missionCompleted,
    cleaningCount: cleaningState.cleaningCount,
    showerMinutes: showerRecord.totalSeconds > 0
      ? getDisplayShowerMinutes(showerRecord.totalSeconds)
      : 0,
    showerCount: showerRecord.sessions.length,
  });
}
