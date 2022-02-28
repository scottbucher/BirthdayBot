import { ShardingManager } from 'discord.js';
import { Request, Response, Router } from 'express';
import router from 'express-promise-router';

import { CustomClient } from '../extensions/custom-client.js';
import { mapClass } from '../middleware/map-class.js';
import { SendSubscriptionEventRequest } from '../models/cluster-api/index.js';
import { SubscriptionStatusName } from '../models/subscription-models.js';
import { Controller } from './controller.js';

let Config = require('../../config/config.json');

export class SubscriptionEventsController implements Controller {
    public path = '/subscription-events';
    public router: Router = router();
    public authToken: string = Config.api.secret;

    constructor(private shardManager: ShardingManager) {}

    public register(): void {
        this.router.post('/', mapClass(SendSubscriptionEventRequest), (req, res) =>
            this.post(req, res)
        );
    }

    private async post(req: Request, res: Response): Promise<void> {
        let reqBody: SendSubscriptionEventRequest = res.locals.input;

        let status = reqBody.subscription.status;

        switch (status) {
            case SubscriptionStatusName.ACTIVE:
            case SubscriptionStatusName.CANCELLED:
            case SubscriptionStatusName.EXPIRED: {
                await this.shardManager.broadcastEval(
                    async (client: CustomClient, context) => {
                        return await client.notifySubscription(
                            context.subscriber,
                            context.plan,
                            context.status
                        );
                    },
                    { context: { subscriber: reqBody.subscriber, plan: reqBody.plan, status } }
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
