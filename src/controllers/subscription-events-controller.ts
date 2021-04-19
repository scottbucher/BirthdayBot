import { Request, Response, Router } from 'express';
import { SubscriptionStatus, SubscriptionStatusName } from '../models/subscription-models';

import { Controller } from './controller';
import { ShardingManager } from 'discord.js';
import { checkAuth } from '../middleware';
import router from 'express-promise-router';

let Config = require('../../config/config.json');

export class SubscriptionEventsController implements Controller {
    public path = '/subscription-events';
    public router: Router = router();

    constructor(private shardManager: ShardingManager) {
        this.router.use(checkAuth(Config.api.secret));
        this.router.post(this.path, (req, res) => this.post(req, res));
    }

    private async post(req: Request, res: Response): Promise<void> {
        let resBody: SubscriptionStatus = res.locals.input;

        let subscriber = resBody.subscriber;
        let plan = resBody.plan;
        let status = resBody.subscription?.status;

        if (!(subscriber && plan && status)) res.sendStatus(400);

        switch (resBody.subscription?.status) {
            case SubscriptionStatusName.ACTIVE:
            case SubscriptionStatusName.CANCELLED:
            case SubscriptionStatusName.EXPIRED: {
                await this.shardManager.broadcastEval(
                    `this.notifySubscription('${subscriber}', '${plan}', '${status}')`
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
