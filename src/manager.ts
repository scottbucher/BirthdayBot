import { Shard, ShardingManager } from 'discord.js';

import { Logger } from './services';
import { Job } from './jobs';

let Logs = require('../lang/logs.json');
let Config = require('../config/config.json');

export class Manager {
    constructor(private shardManager: ShardingManager, private jobs: Job[]) {}

    public async start(): Promise<void> {
        Logger.info(
            Logs.info.spawningShards.replace(
                '{SHARD_COUNT}',
                this.shardManager.totalShards.toLocaleString()
            )
        );
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

        this.startJobs();
    }

    private registerListeners(): void {
        this.shardManager.on('shardCreate', shard => this.onShardCreate(shard));
    }

    private startJobs(): void {
        for (let job of this.jobs) {
            job.start();
        }
    }

    private onShardCreate(shard: Shard): void {
        Logger.info(Logs.info.launchedShard.replace('{SHARD_ID}', shard.id.toString()));
    }
}
