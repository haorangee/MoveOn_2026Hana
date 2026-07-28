import { useCallback, useState } from 'react';
import type { ActivityCategory } from '@/features/activity/constants/activityCategory';
import type { ProcessActivityRewardResult } from '@/features/activity/rewards/types/reward';

export function useActivityRewardModal() {
  const [rewardResult, setRewardResult] = useState<ProcessActivityRewardResult | null>(null);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [rewardCategoryId, setRewardCategoryId] = useState<ActivityCategory | null>(null);

  const showRewardResult = useCallback((
    categoryId: ActivityCategory | null,
    result: ProcessActivityRewardResult | null,
  ) => {
    setRewardCategoryId(categoryId);
    setRewardResult(result);
    setRewardModalVisible(true);
  }, []);

  const closeRewardModal = useCallback(() => {
    setRewardModalVisible(false);
  }, []);

  const clearRewardResult = useCallback(() => {
    setRewardModalVisible(false);
    setRewardResult(null);
    setRewardCategoryId(null);
  }, []);

  return {
    rewardResult,
    rewardModalVisible,
    rewardCategoryId,
    showRewardResult,
    closeRewardModal,
    clearRewardResult,
  };
}

