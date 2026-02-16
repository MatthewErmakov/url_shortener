import { SubscriptionType } from '@libs/shared';

export type UserMeResponse = {
    email: string;
    xApiKey: string;
    subscriptionType: SubscriptionType;
};
