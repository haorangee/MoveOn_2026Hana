export type StudyCategory = { id: string; name: string; color: string; totalStudySeconds: number; createdAt: string };
export type StudySession = { id: string; categoryId: string; startedAt: string; endedAt?: string; durationSeconds: number; earnedPages: number; earnedBooks: number };
export type BookProgress = { categoryId: string; completedBookCount: number; remainingPageCount: number; updatedAt: string };
export type DailyQuest = { id: string; title: string; questType: 'study' | 'shower' | 'water' | 'clean'; completed: boolean; rewardExperience: number; rewardCoin: number };
export type SpaceType = 'bookshelf' | 'studyRoom' | 'library';
export type MagazineType = 'daily' | 'weekly' | 'monthly';

