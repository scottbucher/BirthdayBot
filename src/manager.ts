import { Shard, ShardingManager } from 'discord.js';

import { JobService, Logger } from './services';
import { Job } from './jobs';

let Logs = require('../lang/logs.json');
let Config = require('../config/config.json');

export class Manager {
    constructor(private shardManager: ShardingManager, private jobsService: JobService) { }

    public async start(): Promise<void> {
        this.registerListeners();

        // TODO: Refactor this once DJS fixes their typings
        // tslint:disable-next-line:no-string-literal
        let shardList: number[] = this.shardManager['shardList'];
        try {
            Logger.info(
                Logs.info.spawningShards
                    .replace('{SHARD_COUNT}', shardList.length.toLocaleString())
                    .replace('{SHARD_LIST}', shardList.join(', '))
            );
            await this.shardManager.spawn(
                this.shardManager.totalShards,
                Config.sharding.spawnDelay * 1000,
                Config.sharding.spawnTimeout * 1000
            );
        } catch (error) {
            Logger.error(Logs.error.spawnShard, error);
            return;
        }

        this.jobsService.start();
    }

    private registerListeners(): void {
        this.shardManager.on('shardCreate', shard => this.onShardCreate(shard));
    }

    private onShardCreate(shard: Shard): void {
        Logger.info(Logs.info.launchedShard.replace('{SHARD_ID}', shard.id.toString()));
    }
}
