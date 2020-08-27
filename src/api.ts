import express from 'express';

import { VoteData } from './models/database';
import { Logger } from './services';
import { UserRepo } from './services/database/repos';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

const app = express();

export class Api {
    constructor(private userRepo: UserRepo) {}

    public async start(): Promise<void> {
        // Tell express to use JSON parsing
        app.use(express.json());

        // Capture a vote
        app.post('/votes', async (req, res) => {
            if (req.headers?.authorization !== Config.apiAuthentication) {
                res.sendStatus(401);
                return;
            }

            try {
                let voteData = new VoteData(req.body);
                await this.userRepo.addUserVote('top.gg', voteData.UserDiscordId);
            } catch (error) {
                Logger.error(
                    Logs.error.registeringVote.replace('{USER_ID}', req.body.UserDiscordId),
                    error
                );
                res.sendStatus(500);
                return;
            }

            res.sendStatus(201);
        });

        // Voting Api Ready
        app.get('*', (req, res) => {
            res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        // Voting Api has started
        app.listen(Config.apiPort, () => Logger.info(Logs.info.startedVotingApi));
    }
}
