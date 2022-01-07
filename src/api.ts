import express, { Express } from 'express';
import util from 'util';

import { Controller } from './controllers';
import { checkAuth, handleError } from './middleware';
import { Logger } from './services';

const Config = require('../config/config.json');
const Logs = require('../lang/logs.json');

export class Api {
    private app: Express;

    constructor(public controllers: Controller[]) {
        this.app = express();
        this.app.use(express.json());
        this.setupControllers();
        this.app.use(handleError());
    }

    public async start(): Promise<void> {
        const listen = util.promisify(this.app.listen.bind(this.app));
        await listen(Config.api.port);
        Logger.info(Logs.info.apiStarted.replaceAll('{PORT}', Config.api.port));
    }

    private setupControllers(): void {
        for (const controller of this.controllers) {
            if (controller.authToken) {
                controller.router.use(checkAuth(controller.authToken));
            }
            controller.register();
            this.app.use(controller.path, controller.router);
        }
    }
}
