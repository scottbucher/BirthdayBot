import { SubscriptionLink, SubscriptionStatus } from '../models/subscription-models';
import { HttpService } from './http-service';

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

        return await res.json();
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

        return await res.json();
    }

    public async getAllSubscription(planName: string): Promise<SubscriptionStatus[]> {
        let res = await this.httpService.get(
            `${Config.payments.url}/plans/${planName}/subscriptions/`,
            Config.payments.token
        );

        if (res.status === 404) return;

        if (!res.ok) return;

        return await res.json();
    }

    public async hasService(planName: string, subscriberId: string): Promise<boolean> {
        let subscription = await this.getSubscription(planName, subscriberId);
        return !subscription ? false : subscription.service;
    }
}
