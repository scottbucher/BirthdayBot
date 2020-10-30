import { Request, Response, Router } from 'express';

import { Controller } from './controller';
import router from 'express-promise-router';

export class RootController implements Controller {
    public path = '/';
    public router: Router = router();

    constructor() {
        this.router.get(this.path, (req, res) => this.get(req, res));
    }

    private async get(req: Request, res: Response): Promise<void> {
        res.status(200).json({ message: 'Birthday Bot API' });
    }
}
