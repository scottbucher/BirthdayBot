import { IsDefined, IsNumberString, Length } from 'class-validator';
import { PlanName, SubscriptionStatusName } from '../subscription-models';

export class SendSubscriptionEventRequest {
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
