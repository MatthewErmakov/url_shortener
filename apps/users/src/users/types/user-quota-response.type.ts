import { SubscriptionType } from '@libs/shared';

export type UserQuotaResponse = {
    subscriptionType: SubscriptionType;
    totalQuota: number;
    createdCount: number;
    remainingCount: number;
};
