import { checkAuth, handleError } from './middleware';
import express, { ErrorRequestHandler, Express, RequestHandler } from 'express';

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
        this.app.use(handleError());
        this.setupControllers();
    }

    public async start(): Promise<void> {
        let listen = util.promisify(this.app.listen.bind(this.app));
        await listen(Config.api.port);
        Logger.info(Logs.info.apiStarted.replace('{PORT}', Config.api.port));
    }

    private setupControllers(): void {
        for (let controller of this.controllers) {
            this.app.use('/', controller.router);
        }
    }
}
