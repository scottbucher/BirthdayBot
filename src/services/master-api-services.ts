import {
    LoginClusterResponse,
    RegisterClusterRequest,
    RegisterClusterResponse,
} from '../models/master-api';

import { URL } from 'url';
import { HttpService } from '.';

const Config = require('../../config/config.json');

export class MasterApiService {
    private clusterId: string;

    constructor(private httpService: HttpService) {}

    public async register(): Promise<void> {
        const reqBody: RegisterClusterRequest = {
            shardCount: Config.clustering.shardCount,
            callback: {
                url: Config.clustering.callbackUrl,
                token: Config.api.secret,
            },
        };

        const res = await this.httpService.post(
            new URL('/clusters', Config.clustering.masterApi.url),
            Config.clustering.masterApi.token,
            reqBody
        );

        if (!res.ok) {
            throw res;
        }

        const resBody: RegisterClusterResponse = await res.json();
        this.clusterId = resBody.id;
    }

    public async login(): Promise<LoginClusterResponse> {
        const res = await this.httpService.put(
            new URL(`/clusters/${this.clusterId}/login`, Config.clustering.masterApi.url),
            Config.clustering.masterApi.token
        );

        if (!res.ok) {
            throw res;
        }

        return await res.json();
    }

    public async ready(): Promise<void> {
        const res = await this.httpService.put(
            new URL(`/clusters/${this.clusterId}/ready`, Config.clustering.masterApi.url),
            Config.clustering.masterApi.token
        );

        if (!res.ok) {
            throw res;
        }
    }
}
