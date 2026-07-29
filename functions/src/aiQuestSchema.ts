import {z} from "zod";

export const AI_QUEST_CATEGORIES = [
  "study",
  "cleaning",
  "shower",
  "water",
  "etc",
] as const;

export const AI_QUEST_EXECUTION_TYPES = [
  "simple",
  "study",
  "cleaning",
  "shower",
  "water",
  "my_time",
] as const;

export const AI_QUEST_LEVELS = [
  "very_easy",
  "easy",
  "action",
] as const;

const questTitleSchema = z.string().trim().min(1).max(100);

export const generateAIQuestsRequestSchema = z.object({
  message: z.string().trim().min(1).max(500),
  mode: z.enum(["first", "next"]),
  originalMessage: z.string().trim().max(500).optional(),
  previousQuests: z.array(questTitleSchema).max(20).optional(),
  completedQuests: z.array(questTitleSchema).max(20).optional(),
  categoryHint: z.enum(AI_QUEST_CATEGORIES).optional(),
}).strict();

const generatedQuestSchema = z.object({
  title: questTitleSchema,
  category: z.enum(AI_QUEST_CATEGORIES),
  executionType: z.enum(AI_QUEST_EXECUTION_TYPES),
  level: z.enum(AI_QUEST_LEVELS),
  durationMinutes: z.number().int().nullable(),
}).strict();

export const generatedAIQuestsSchema = z.object({
  empathy: z.string().trim().min(1).max(300),
  quests: z.array(generatedQuestSchema).length(3),
}).strict();

export type GenerateAIQuestsRequest = z.infer<
  typeof generateAIQuestsRequestSchema
>;

export type GeneratedAIQuests = z.infer<typeof generatedAIQuestsSchema>;

type AIQuestCategory = typeof AI_QUEST_CATEGORIES[number];
type AIQuestExecutionType = typeof AI_QUEST_EXECUTION_TYPES[number];

const EXECUTION_TYPES_BY_CATEGORY: Record<
  AIQuestCategory,
  readonly AIQuestExecutionType[]
> = {
  study: ["simple", "study", "my_time"],
  cleaning: ["simple", "cleaning"],
  shower: ["simple", "shower"],
  water: ["simple", "water"],
  etc: ["simple", "my_time"],
};

/**
 * Normalizes a quest title for duplicate comparisons.
 *
 * @param {string} title Quest title to normalize.
 * @return {string} Normalized title.
 */
function normalizeTitle(title: string): string {
  return title.normalize("NFKC").trim().toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, " ");
}

/**
 * Checks whether a duration matches its execution type.
 *
 * @param {AIQuestExecutionType} executionType Quest execution type.
 * @param {number|null} durationMinutes Requested duration.
 * @return {boolean} Whether the duration is valid.
 */
function hasValidDuration(
  executionType: AIQuestExecutionType,
  durationMinutes: number | null,
): boolean {
  if (executionType === "simple" || executionType === "water" ||
      executionType === "shower") {
    return durationMinutes === null;
  }

  if (executionType === "my_time") {
    return durationMinutes !== null &&
      [5, 10, 15].includes(durationMinutes);
  }

  return durationMinutes === null ||
    (durationMinutes >= 5 && durationMinutes <= 15);
}

/**
 * Applies semantic checks that are stricter than the output schema.
 *
 * @param {GeneratedAIQuests} result Parsed model output.
 * @param {GenerateAIQuestsRequest} request Validated callable request.
 */
export function validateGeneratedAIQuests(
  result: GeneratedAIQuests,
  request: GenerateAIQuestsRequest,
): void {
  result.quests.forEach((quest, index) => {
    if (quest.level !== AI_QUEST_LEVELS[index]) {
      throw new Error("Invalid quest level order");
    }

    if (!EXECUTION_TYPES_BY_CATEGORY[quest.category]
      .includes(quest.executionType)) {
      throw new Error("Invalid category and execution type combination");
    }

    if (!hasValidDuration(quest.executionType, quest.durationMinutes)) {
      throw new Error("Invalid quest duration");
    }

    if (request.categoryHint && quest.category !== request.categoryHint) {
      throw new Error("Generated quest does not match category hint");
    }
  });

  const titles = result.quests.map((quest) => normalizeTitle(quest.title));
  if (new Set(titles).size !== titles.length) {
    throw new Error("Duplicate generated quest title");
  }

  if (request.mode === "next") {
    const existingTitles = new Set([
      ...(request.previousQuests ?? []),
      ...(request.completedQuests ?? []),
    ].map(normalizeTitle));

    if (titles.some((title) => existingTitles.has(title))) {
      throw new Error("Generated quest duplicates an existing title");
    }
  }
}
