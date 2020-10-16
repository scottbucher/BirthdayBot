export interface SubscriptionLink {
    link: string;
}

export interface SubscriptionStatus {
    app: string;
    plan: string;
    subscriber: string;
    service: boolean;
    subscription?: SubscriptionLink;
    override?: Override;
    time: string;
}

interface Subscription {
    service: boolean;
    id: string;
    status: string;
    times: Times;
}

interface Override {
    service: boolean;
    status: string;
    endTime?: string;
}

interface Times {
    lastPayment?: string;
    paidUntil?: string;
    updated: string;
}

export enum PlanName {
    premium = 'premium',
}

export enum SubscriptionStatusName {
    APPROVAL_PENDING = 'APPROVAL_PENDING',
    APPROVED = 'APPROVED',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}