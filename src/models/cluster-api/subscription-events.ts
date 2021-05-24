import { IsDefined, IsNumberString, Length } from 'class-validator';
import { PlanName, SubscriptionStatusName } from '../subscription-models';

export class SubscriptionEventRequest {
    @IsDefined()
    @IsNumberString()
    @Length(18, 20)
    subscriber: string;

    @IsDefined()
    plan: PlanName;

    @IsDefined()
    subscription: {
        status: SubscriptionStatusName;
    };
}
