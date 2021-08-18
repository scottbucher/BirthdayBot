import { JobService, Logger } from './services';
import { Shard, ShardingManager } from 'discord.js';

let Config = require('../config/config.json');
let Debug = require('../config/debug.json');
let Logs = require('../lang/logs.json');

export class Manager {
    constructor(private shardManager: ShardingManager, private jobsService: JobService) {}

    public async start(): Promise<void> {
        this.registerListeners();

        // TODO: Refactor this once DJS fixes their typings
        // tslint:disable-next-line:no-string-literal
        let shardList = this.shardManager.shardList as number[];
        try {
            Logger.info(
                Logs.info.spawningShards
                    .replace('{SHARD_COUNT}', shardList.length.toLocaleString())
                    .replace('{SHARD_LIST}', shardList.join(', '))
            );
            await this.shardManager.spawn({
                amount: this.shardManager.totalShards,
                delay: Config.sharding.spawnDelay * 1000,
                timeout: Config.sharding.spawnTimeout * 1000,
            });
            Logger.info(Logs.info.allShardsSpawned);
        } catch (error) {
            Logger.error(Logs.error.spawnShard, error);
            return;
        }

        if (Debug.dummyMode.enabled) {
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
