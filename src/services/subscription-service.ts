import { createRequire } from 'node:module';

import { SubscriptionLink, SubscriptionStatus } from '../models/index.js';
import { HttpService } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class SubscriptionService {
    constructor(private httpService: HttpService) {}

    public async createSubscription(
        planName: string,
        subscriberId: string
    ): Promise<SubscriptionLink> {
        let res = await this.httpService.post(
            `${Config.payments.url}/plans/${planName}/subscriptions/${subscriberId}`,
            Config.payments.token
        );

        // 409 Conflict means there is already an active subscription
        if (res.status === 409) return;

        if (!res.ok) return;

        (await res.json()) as SubscriptionLink;
    }

    public async getSubscription(
        planName: string,
        subscriberId: string
    ): Promise<SubscriptionStatus> {
        let res = await this.httpService.get(
            `${Config.payments.url}/plans/${planName}/subscriptions/${subscriberId}`,
            Config.payments.token
        );

        if (res.status === 404) return;

        if (!res.ok) return;

        return (await res.json()) as SubscriptionStatus;
    }

    public async getAllSubscription(planName: string): Promise<SubscriptionStatus[]> {
        let res = await this.httpService.get(
            `${Config.payments.url}/plans/${planName}/subscriptions/`,
            Config.payments.token
        );

        if (res.status === 404) return;

        if (!res.ok) return;

        (await res.json()) as SubscriptionStatus[];
    }

    public async hasService(planName: string, subscriberId: string): Promise<boolean> {
        let subscription = await this.getSubscription(planName, subscriberId);
        return !subscription ? false : subscription.service;
    }
}
