import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsNumberString, Length, ValidateNested } from 'class-validator';

import { PlanName, SubscriptionStatusName } from '../index.js';

export class Subscription {
    @IsDefined()
    @IsEnum(SubscriptionStatusName)
    status: string;
}

export class SendSubscriptionEventRequest {
    @IsDefined()
    @IsNumberString()
    @Length(18, 20)
    subscriber: string;

    @IsDefined()
    @IsEnum(PlanName)
    plan: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => Subscription)
    subscription: Subscription;
}
