import { Request, Response, Router } from 'express';
import router from 'express-promise-router';

import { mapClass } from '../middleware/map-class.js';
import { SendVoteRequest } from '../models/cluster-api/votes.js';
import { UserRepo } from '../services/database/repos/user-repo.js';
import { Controller } from './controller.js';

let Config = require('../../config/config.json');

export class VotesController implements Controller {
    public path = '/site';
    public router: Router = router();
    public authToken: string = Config.voting.secret;

    constructor(private userRepo: UserRepo) {}

    public register(): void {
        this.router.post('/:site/votes', mapClass(SendVoteRequest), (req, res) =>
            this.post(req, res)
        );
    }

    private async post(req: Request, res: Response): Promise<void> {
        let reqBody: SendVoteRequest = res.locals.input;

        let siteName = req.params.site;

        switch (siteName) {
            case 'top-gg':
                // Add the vote
                await this.userRepo.addUserVote(siteName, reqBody.user);

                res.sendStatus(201);
                return;
            default:
                res.sendStatus(404);
                return;
        }
    }
}
