import express, { ErrorRequestHandler, Express } from 'express';

import { Controller } from './controllers';
import { Logger } from './services';
import util from 'util';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

export class Api {
    private app: Express;

    constructor(public controllers: Controller[]) {
        this.app = express();
        this.app.use(express.json());
        this.setupControllers();
    }

    // Start Api
    public async start(): Promise<void> {
        let listen = util.promisify(this.app.listen.bind(this.app));
        await listen(Config.api.port);
        Logger.info(Logs.info.startedApi.replace('{PORT}', Config.api.port));
    }

    // Setup the controllers
    private setupControllers(): void {
        for (let controller of this.controllers) {
            controller.router.use(this.handleError);
            this.app.use('/', controller.router);
        }
    }

    // Handle errors from the controllers
    private handleError: ErrorRequestHandler = (error, req, res, next) => {
        Logger.error(
            Logs.error.apiRequest.replace('{HTTP_METHOD}', req.method).replace('{URL}', req.url),
            error
        );
        res.status(500).json({ error: true, message: error.message });
    };
}
