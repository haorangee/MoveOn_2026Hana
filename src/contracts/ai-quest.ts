export type AIQuestCategory =
  | 'study'
  | 'cleaning'
  | 'shower'
  | 'water'
  | 'etc';

export type AIQuestExecutionType =
  | 'simple'
  | 'study'
  | 'cleaning'
  | 'shower'
  | 'water'
  | 'my_time';

export type AIQuestLevel =
  | 'very_easy'
  | 'easy'
  | 'action';

export type AIQuestOption = {
  id: string;
  title: string;
  category: AIQuestCategory;
  executionType: AIQuestExecutionType;
  level: AIQuestLevel;
  durationMinutes?: number;
};

export type AIQuestResponse = {
  empathy: string;
  quests: [
    AIQuestOption,
    AIQuestOption,
    AIQuestOption,
  ];
};
