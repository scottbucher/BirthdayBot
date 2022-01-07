import { ShardingManager } from 'discord.js';
import 'reflect-metadata';

import { Api } from './api';
import { GuildsController, RootController, ShardsController } from './controllers';
import { UpdateServerCountJob } from './jobs';
import { Manager } from './manager';
import { HttpService, JobService, Logger, MasterApiService } from './services';
import { MathUtils, ShardUtils } from './utils';

const Config = require('../config/config.json');
const Debug = require('../config/debug.json');
const Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info(Logs.info.appStarted);

    // Dependencies
    const httpService = new HttpService();
    const masterApiService = new MasterApiService(httpService);
    if (Config.clustering.enabled) {
        await masterApiService.register();
    }

    // Sharding
    let shardList: number[];
    let totalShards: number;
    try {
        if (Config.clustering.enabled) {
            const resBody = await masterApiService.login();
            shardList = resBody.shardList;
            const requiredShards = await ShardUtils.requiredShardCount(Config.client.token);
            totalShards = Math.max(requiredShards, resBody.totalShards);
        } else {
            const recommendedShards = await ShardUtils.recommendedShardCount(
                Config.client.token,
                Config.sharding.serversPerShard
            );
            shardList = MathUtils.range(0, recommendedShards);
            totalShards = recommendedShards;
        }
    } catch (error) {
        Logger.error(Logs.error.retrieveShards, error);
        return;
    }

    if (shardList.length === 0) {
        Logger.warn(Logs.warn.managerNoShards);
        return;
    }

    const shardManager = new ShardingManager('dist/start.js', {
        token: Config.client.token,
        mode: Debug.override.shardMode.enabled ? Debug.override.shardMode.value : 'worker',
        respawn: true,
        totalShards,
        shardList,
    });

    // Jobs
    const jobs = [
        Config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService),
    ].filter(Boolean);
    const jobService = new JobService(jobs);

    const manager = new Manager(shardManager, jobService);

    // API
    const guildsController = new GuildsController(shardManager);
    const shardsController = new ShardsController(shardManager);
    const rootController = new RootController();
    const api = new Api([guildsController, shardsController, rootController]);

    // Start
    await manager.start();
    await api.start();
    if (Config.clustering.enabled) {
        await masterApiService.ready();
    }
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
