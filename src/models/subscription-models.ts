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
    premium1 = 'premium-1',
    premium3 = 'premium-3',
    premium6 = 'premium-6',
    premium12 = 'premium-12',
}

export enum SubscriptionStatusName {
    APPROVAL_PENDING = 'APPROVAL_PENDING',
    APPROVED = 'APPROVED',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}