import { Request, Response, Router } from 'express';

import { Controller } from './controller';
import { CustomClient } from '../extensions';
import { SendSubscriptionEventRequest } from '../models/cluster-api';
import { ShardingManager } from 'discord.js';
import { SubscriptionStatusName } from '../models/subscription-models';
import { mapClass } from '../middleware';
import router from 'express-promise-router';

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
                    async (client, context) => {
                        let customClient = client as CustomClient;
                        return await customClient.notifySubscription(
                            context.subscriber,
                            context.plan,
                            status
                        );
                    },
                    { context: { subscriber: reqBody.subscriber, plan: reqBody.plan } }
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
