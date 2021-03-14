import { ShardClientUtil, ShardingManager, Util } from 'discord.js';
import { MathUtils } from '.';

export class ShardUtils {
    public static async recommendedShards(token: string, serversPerShard: number): Promise<number> {
        return Math.ceil(await Util.fetchRecommendedShards(token, serversPerShard));
    }

    public static myShardIds(
        totalShards: number,
        machineId: number,
        totalMachines: number
    ): number[] {
        let myShardIds: number[] = [];
        for (let shardId = 0; shardId < totalShards; shardId++) {
            if (shardId % totalMachines === machineId) {
                myShardIds.push(shardId);
            }
        }
        return myShardIds;
    }

    public static async serverCount(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardGuildCounts: number[] = await shardInterface.fetchClientValues(
            'guilds.cache.size'
        );
        return MathUtils.sum(shardGuildCounts);
    }

    public static async userCount(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardUserCounts: number[] = await shardInterface.fetchClientValues('users.cache.size');
        return MathUtils.sum(shardUserCounts);
    }
}
