import { Request, Response, Router } from 'express';
import router from 'express-promise-router';

import { VoteData } from '../models/database';
import { UserRepo } from '../services/database/repos';
import { Controller } from './controller';

let Config = require('../../config/config.json');

export class VotesController implements Controller {
    public path = '/site/:site/votes';
    public router: Router = router();
    public authToken: string = Config.voting.secret;

    constructor(private userRepo: UserRepo) {
        this.router.post(this.path, (req, res) => this.post(req, res));
    }

    private async post(req: Request, res: Response): Promise<void> {
        let siteName = req.params.site;

        switch (siteName) {
            case 'top-gg':
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
