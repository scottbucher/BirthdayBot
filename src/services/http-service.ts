import * as rp from 'request-promise';

import { Logger } from './logger';

export class HttpService {
    public async post(url: string, body: any, authorization: string): Promise<void> {
        let result = await rp.post(url, { body, json: true, headers: { Authorization: authorization } });
    }
}
