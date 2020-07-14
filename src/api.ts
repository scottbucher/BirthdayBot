import { Logger } from './services';
import { UserRepo } from './services/database/repos';
import { VoteData } from './models/database/vote-models';
import express from 'express';

const app = express();
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;

export class Api {

    constructor(private userRepo: UserRepo) {}

    public async start(): Promise<void> {
        // Tell express to use body-parser's JSON parsing
        app.use(bodyParser.json());

        // Voting Api Ready
        app.get('/votes', (req, res) => {
            res.send('Voting Api Ready.');
        });

        // Server Running
        app.listen(PORT, () => console.log('Server Running.'));

        // Get the votes
        app.post('/votes', async (req, res) => {
            let voteData = new VoteData(req.body);

            Logger.info(`Vote data: ${voteData}`);

            await this.userRepo.addUserVote('top.gg', voteData.UserDiscordId);
        });
    }
}