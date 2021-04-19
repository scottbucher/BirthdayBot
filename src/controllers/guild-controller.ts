import { Request, Response, Router } from 'express';

import { Controller } from './controller';
import { GetGuildsResponse } from '../models/cluster-api';
import { ShardingManager } from 'discord.js';
import { checkAuth } from '../middleware';
import router from 'express-promise-router';

let Config = require('../../config/config.json');
export class GuildsController implements Controller {
    public path = '/guilds';
    public router: Router = router();

    constructor(private shardManager: ShardingManager) {
        this.router.use(checkAuth(Config.api.secret));
        this.router.get(this.path, (req, res) => this.getGuilds(req, res));
    }

    private async getGuilds(req: Request, res: Response): Promise<void> {
        let guilds: string[] = [
            ...new Set(
                (await this.shardManager.broadcastEval('this.guilds.cache.keyArray()')).flat()
            ),
        ];

        let resBody: GetGuildsResponse = {
            guilds,
        };
        res.status(200).json(resBody);
    }
}
