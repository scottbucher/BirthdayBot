import { Request, Response, Router } from 'express';

import { Controller } from './controller';
import { ShardingManager } from 'discord.js';
import { SubscriptionStatusName } from '../models/subscription-models';
import router from 'express-promise-router';

let Config = require('../../config/config.json');

export class SubscriptionEventsController implements Controller {
    public path = '/subscription-events';
    public router: Router = router();

    constructor(private shardManager: ShardingManager) {
        this.router.post(this.path, (req, res) => this.post(req, res));
    }

    private async post(req: Request, res: Response): Promise<void> {
        if (req.headers.authorization !== Config.payments.token) {
            res.send(401);
            return;
        }

        let subscriber = req.body.subscriber;
        let plan = req.body.plan;
        let status = req.body.subscription?.status;

        if (!(subscriber && plan && status)) res.sendStatus(400);

        switch (status) {
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
