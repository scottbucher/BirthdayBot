import { APIMessage, ShardingManager } from 'discord.js';
import {
    BotsOnDiscordXyzSite,
    DiscordBotListComSite,
    DiscordBotsGgSite,
    TopGgSite,
} from './services/sites';
import { HttpService, Logger } from './services';
import { RootController, SubscriptionEventsController, VotesController } from './controllers';

import { Api } from './api';
import { DataAccess } from './services/database/data-access';
import { Manager } from './manager';
import { ShardUtils } from './utils';
import { UserRepo } from './services/database/repos';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');
let Debug = require('../config/debug.json');

async function start(): Promise<void> {
    Logger.info(Logs.info.started);
    let httpService = new HttpService();

    // Bot sites
    let topGgSite = new TopGgSite(Config.botSites.topGg, httpService);
    let botsOnDiscordXyzSite = new BotsOnDiscordXyzSite(
        Config.botSites.botsOnDiscordXyz,
        httpService
    );
    let discordBotsGgSite = new DiscordBotsGgSite(Config.botSites.discordBotsGg, httpService);
    let discordBotListComSite = new DiscordBotListComSite(
        Config.botSites.discordBotListCom,
        httpService
    );

    // Sharding
    let totalShards = 0;
    try {
        totalShards = Debug.override.shardCount.enabled
            ? Debug.override.shardCount.value
            : await ShardUtils.getRecommendedShards(
                  Config.client.token,
                  Config.sharding.serversPerShard
              );
    } catch (error) {
        Logger.error(Logs.error.retrieveShardCount, error);
        return;
    }

    let myShardIds = ShardUtils.getMyShardIds(
        totalShards,
        Config.sharding.machineId,
        Config.sharding.machineCount
    );

    if (myShardIds.length === 0) {
        Logger.warn(Logs.warn.noShards);
        return;
    }

    let shardManager = new ShardingManager('dist/start.js', {
        token: Config.client.token,
        mode: Debug.override.shardMode.enabled ? Debug.override.shardMode.value : 'worker',
        respawn: true,
        totalShards,
        shardList: myShardIds,
    });

    // Data Access for repos
    let dataAccess = new DataAccess(Config.mysql);

    // Repos
    let userRepo = new UserRepo(dataAccess);

    let manager = new Manager(
        shardManager,
        [topGgSite, botsOnDiscordXyzSite, discordBotsGgSite, discordBotListComSite].filter(
            botSite => botSite.enabled
        )
    );

    // API
    let rootController = new RootController();
    let votesController = new VotesController(userRepo);
    let subscriptionEventsController = new SubscriptionEventsController(shardManager);
    let api = new Api([rootController, votesController, subscriptionEventsController]);

    // Start
    await api.start();
    await manager.start();

    // Start schedule to update server count
    setInterval(async () => {
        try {
            await manager.updateServerCount();
        } catch (error) {
            Logger.error(Logs.error.updateServerCount, error);
        }
    }, Config.jobs.updateServerCount.interval * 1000);
}

start();
