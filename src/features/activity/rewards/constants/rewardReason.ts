export const REWARD_REASON = {
  ELIGIBLE: 'eligible',
  ACTIVITY_NOT_COMPLETED: 'activity_not_completed',
  INVALID_ACTIVITY: 'invalid_activity',
  BELOW_MINIMUM_DURATION: 'below_minimum_duration',
  DAILY_XP_LIMIT_REACHED: 'daily_xp_limit_reached',
  DAILY_GRAPE_LIMIT_REACHED: 'daily_grape_limit_reached',
  WATER_GOAL_ALREADY_REWARDED: 'water_goal_already_rewarded',
} as const;

export type RewardReason =
  (typeof REWARD_REASON)[keyof typeof REWARD_REASON];
