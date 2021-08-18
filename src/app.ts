import 'reflect-metadata';

import {
    GuildsController,
    RootController,
    ShardsController,
    SubscriptionEventsController,
    VotesController,
} from './controllers';
import { HttpService, JobService, Logger, MasterApiService } from './services';
import { MathUtils, ShardUtils } from './utils';

import { Api } from './api';
import { DataAccess } from './services/database/data-access';
import { Manager } from './manager';
import { ShardingManager } from 'discord.js';
import { UpdateServerCountJob } from './jobs';
import { UserRepo } from './services/database/repos';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');
let Debug = require('../config/debug.json');

async function start(): Promise<void> {
    Logger.info(Logs.info.started);

    // Dependencies
    let httpService = new HttpService();
    let masterApiService = new MasterApiService(httpService);
    if (Config.clustering.enabled) await masterApiService.register();

    // Sharding
    let shardList: number[];
    let totalShards: number;
    try {
        if (Config.clustering.enabled) {
            let resBody = await masterApiService.login();
            shardList = resBody.shardList;
            let requiredShards = await ShardUtils.requiredShardCount(
                Config.client.token,
                Config.sharding.largeBotSharding
            );
            totalShards = Math.max(requiredShards, resBody.totalShards);
        } else {
            let recommendedShards = await ShardUtils.recommendedShardCount(
                Config.client.token,
                Config.sharding.serversPerShard,
                Config.sharding.largeBotSharding
            );
            shardList = MathUtils.range(0, recommendedShards);
            totalShards = recommendedShards;
        }
    } catch (error) {
        Logger.error(Logs.error.retrieveShards, error);
        return;
    }

    if (shardList.length === 0) {
        Logger.warn(Logs.warn.noShards);
        return;
    }

    let shardManager = new ShardingManager('dist/start.js', {
        token: Config.client.token,
        mode: Debug.override.shardMode.enabled ? Debug.override.shardMode.value : 'worker',
        respawn: true,
        totalShards,
        shardList,
    });

    // Data Access for repos
    let dataAccess = new DataAccess(Config.mysql);

    // Repos
    let userRepo = new UserRepo(dataAccess);

    // Jobs
    let jobs = [
        Config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService),
    ].filter(Boolean);
    let jobService = new JobService(jobs);

    let manager = new Manager(shardManager, jobService);

    // API
    let guildsController = new GuildsController(shardManager);
    let shardsController = new ShardsController(shardManager);
    let rootController = new RootController();
    let votesController = new VotesController(userRepo);
    let subscriptionEventsController = new SubscriptionEventsController(shardManager);
    let api = new Api([
        guildsController,
        shardsController,
        rootController,
        votesController,
        subscriptionEventsController,
    ]);

    // Start
    await manager.start();
    await api.start();
    if (Config.clustering.enabled) {
        await masterApiService.ready();
    }
}

start();
