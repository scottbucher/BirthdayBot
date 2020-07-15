import { Logger } from './services';
import { UserRepo } from './services/database/repos';
import { VoteData } from './models/database/vote-data-models';
import bodyParser from 'body-parser';
import express from 'express';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

const app = express();

export class Api {
    constructor(private userRepo: UserRepo) {}

    public async start(): Promise<void> {
        // Tell express to use body-parser's JSON parsing
        app.use(bodyParser.json());

        // Get the votes
        app.post('/votes', async (req, res) => {
            try {
                let voteData = new VoteData(req.body);

                await this.userRepo.addUserVote('top.gg', voteData.UserDiscordId);
            } catch (error) {
                Logger.error(
                    Logs.error.registeringVote.replace('{USER_ID}', req.body.UserDiscordId)
                );
            }
        });

        // Voting Api Ready
        app.get('*', (req, res) => {
            res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        // Voting Api has started
        app.listen(Config.apiPort, () => Logger.info(Logs.info.startedVotingApi));
    }
}
