import { PlanName, SubscriptionStatusName } from '../subscription-models';

export class SubscriptionEventRequest {
    subscriber: string;
    plan: PlanName;
    status: SubscriptionStatusName;
}
