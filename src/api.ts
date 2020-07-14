import { Logger } from './services';
import { UserRepo } from './services/database/repos';
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
        app.get('/', (req, res) => {
            res.send('Voting Api Ready.');
        });

        // Server Running
        app.listen(PORT, () => console.log('Server Running.'));

        // Get the votes
        app.post('/votes', async (req, res) => {
            let botId = req.body.bot;
            let userId = req.body.user;
            let type = req.body.type;
            let isWeekend = req.body.isWeekend;
            let query = req.body.query;

            Logger.info(`BotId: ${botId}`);
            Logger.info(`UserId: ${userId}`);
            Logger.info(`Type: ${type}`);
            Logger.info(`isWeekend: ${isWeekend}`);
            Logger.info(`Query: ${query}`);

            await this.userRepo.updateUserLastVote(userId);
        });
    }
}
