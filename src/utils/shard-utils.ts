import { ShardClientUtil, ShardingManager, Util } from 'discord.js';

import { MathUtils } from '.';

const LARGE_BOT_SHARDING_MULTIPLE = 16;
export class ShardUtils {
    public static async recommendedShardCount(
        token: string,
        guildsPerShard: number,
        largeBotSharding: boolean = false
    ): Promise<number> {
        let num = await Util.fetchRecommendedShards(token, {
            guildsPerShard,
            multipleOf: largeBotSharding ? LARGE_BOT_SHARDING_MULTIPLE : 1,
        });
        return num;
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
