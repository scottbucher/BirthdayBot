import { Request, Response, Router } from 'express';
import { SubscriptionStatus, SubscriptionStatusName } from '../models/subscription-models';
import { checkAuth, mapClass } from '../middleware';

import { Controller } from './controller';
import { ShardingManager } from 'discord.js';
import { SubscriptionEventRequest } from '../models/cluster-api';
import router from 'express-promise-router';

let Config = require('../../config/config.json');

export class SubscriptionEventsController implements Controller {
    public path = '/subscription-events';
    public router: Router = router();

    constructor(private shardManager: ShardingManager) {
        this.router.use(checkAuth(Config.api.secret));
        this.router.post(this.path, mapClass(SubscriptionEventRequest), (req, res) =>
            this.post(req, res)
        );
    }

    private async post(req: Request, res: Response): Promise<void> {
        let subscriptionEventReq: SubscriptionEventRequest = res.locals.input;

        switch (subscriptionEventReq.status) {
            case SubscriptionStatusName.ACTIVE:
            case SubscriptionStatusName.CANCELLED:
            case SubscriptionStatusName.EXPIRED: {
                await this.shardManager.broadcastEval(
                    `this.notifySubscription('${subscriptionEventReq.subscriber}', '${subscriptionEventReq.plan}', '${subscriptionEventReq.status}')`
                );
                res.sendStatus(201);
                return;
            }
            default: {
                res.sendStatus(201);
                return;
            }
        }
    }
}
