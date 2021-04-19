import { Request, Response, Router } from 'express';

import { Controller } from './controller';
import { checkAuth } from '../middleware';
import router from 'express-promise-router';

let Config = require('../../config/config.json');
export class RootController implements Controller {
    public path = '/';
    public router: Router = router();

    constructor() {
        this.router.use(checkAuth(Config.api.secret));
        this.router.get(this.path, (req, res) => this.get(req, res));
    }

    private async get(req: Request, res: Response): Promise<void> {
        res.status(200).json({ message: 'Birthday Bot API' });
    }
}
