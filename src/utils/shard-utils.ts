import { ShardingManager, Util } from 'discord.js';

export abstract class ShardUtils {
    public static async getRecommendedShards(
        token: string,
        serversPerShard: number
    ): Promise<number> {
        return Math.ceil(await Util.fetchRecommendedShards(token, serversPerShard));
    }

    public static getMyShardIds(
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

    public static async retrieveServerCount(shardManager: ShardingManager): Promise<number> {
        let shardSizes = await shardManager.fetchClientValues('guilds.cache.size');
        return shardSizes.reduce((prev, val) => prev + val, 0);
    }
}
