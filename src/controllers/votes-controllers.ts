import { Request, Response, Router } from 'express';

import { Controller } from './controller';
import { UserRepo } from '../services/database/repos';
import { VoteData } from '../models/database';
import router from 'express-promise-router';

let Config = require('../../config/config.json');
let Logs = require('../lang/logs.json');

export class VotesController implements Controller {
    public path = '/site/:site/votes';
    public router: Router = router();

    constructor(private userRepo: UserRepo) {
        this.router.post(this.path, (req, res) => this.post(req, res));
    }

    private async post(req: Request, res: Response): Promise<void> {
        let siteName = req.params.site;

        switch (siteName) {
            case 'top-gg':
                // Check the token of the request
                if (req.headers.authorization !== Config.voting.token) {
                    res.sendStatus(401);
                    return;
                }

                // Validate data
                if (!req.body.user) {
                    res.sendStatus(400);
                    return;
                }

                // Add the vote
                await this.userRepo.addUserVote(siteName, new VoteData(req.body).UserDiscordId);

                res.sendStatus(201);
                return;
            default:
                res.sendStatus(404);
                return;
        }
    }
}
