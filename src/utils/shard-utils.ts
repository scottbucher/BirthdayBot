import { ShardClientUtil, ShardingManager, Util } from 'discord.js';

import { MathUtils } from '.';

const MAX_SERVERS_PER_SHARD = 2500;
const LARGE_BOT_SHARDING_MULTIPLE = 16;

export class ShardUtils {
    public static async requiredShardCount(
        token: string,
        largeBotSharding: boolean = false
    ): Promise<number> {
        return await this.recommendedShardCount(
            token,
            MAX_SERVERS_PER_SHARD,
            largeBotSharding ? 16 : 1
        );
    }

    public static async recommendedShardCount(
        token: string,
        guildsPerShard: number,
        multipleOf: number = 1
    ): Promise<number> {
        return await Util.fetchRecommendedShards(token, {
            guildsPerShard,
            multipleOf,
        });
    }

    public static shardIds(shardInterface: ShardingManager | ShardClientUtil): number[] {
        if (shardInterface instanceof ShardingManager) {
            return shardInterface.shards.map(shard => shard.id);
        } else if (shardInterface instanceof ShardClientUtil) {
            return shardInterface.ids;
        }
    }

    public static async serverCount(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardGuildCounts = (await shardInterface.fetchClientValues(
            'guilds.cache.size'
        )) as number[];
        return MathUtils.sum(shardGuildCounts);
    }
}
