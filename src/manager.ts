import { Shard, ShardingManager } from 'discord.js';

import { Api } from './api';
import { BotSite } from './services/sites';
import { Logger } from './services';
import { ShardUtils } from './utils';

let Logs = require('../lang/logs.json');
let Config = require('../config/config.json');

export class Manager {
    constructor(
        private shardManager: ShardingManager,
        private botSites: BotSite[]
    ) {}

    public async start(): Promise<void> {
        this.registerListeners();
        try {
            await this.shardManager.spawn(
                this.shardManager.totalShards,
                Config.sharding.spawnDelay * 1000,
                Config.sharding.spawnTimeout * 1000
            );
        } catch (error) {
            Logger.error(Logs.error.spawnShard, error);
            return;
        }

        try {
            await this.updateServerCount();
        } catch (error) {
            Logger.error(Logs.error.updateServerCount, error);
        }

    }

    public async updateServerCount(): Promise<void> {
        let serverCount = await ShardUtils.retrieveServerCount(this.shardManager);
        await this.shardManager.broadcastEval(`
            this.user.setPresence({
                activity: {
                    name: 'bdays to ${serverCount.toLocaleString()} servers',
                    type: "STREAMING",
                    url: "${Config.links.stream}"
                }
            });
        `);

        Logger.info(
            Logs.info.updatedServerCount.replace('{SERVER_COUNT}', serverCount.toLocaleString())
        );

        for (let botSite of this.botSites) {
            try {
                await botSite.updateServerCount(serverCount);
            } catch (error) {
                Logger.error(
                    Logs.error.updateServerCountSite.replace('{BOT_SITE}', botSite.name),
                    error
                );
                continue;
            }

            Logger.info(Logs.info.updateServerCountSite.replace('{BOT_SITE}', botSite.name));
        }
    }

    private registerListeners(): void {
        this.shardManager.on('shardCreate', shard => this.onShardCreate(shard));
    }

    private onShardCreate(shard: Shard): void {
        Logger.info(Logs.info.launchedShard.replace('{SHARD_ID}', shard.id.toString()));
    }
}
