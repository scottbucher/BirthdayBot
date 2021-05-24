import { Request, Response, Router } from 'express';
import router from 'express-promise-router';

import { Controller } from './controller';

let Config = require('../../config/config.json');
export class RootController implements Controller {
    public path = '/';
    public router: Router = router();
    public authToken: string = Config.api.secret;

    public register(): void {
        this.router.get('/', (req, res) => this.get(req, res));
    }

    private async get(req: Request, res: Response): Promise<void> {
        res.status(200).json({ message: 'Birthday Bot API' });
    }
}
