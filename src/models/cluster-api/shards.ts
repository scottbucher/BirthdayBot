import { IsDefined, IsEnum, IsString, IsUrl, Length } from 'class-validator';
import { Constants } from 'discord.js';
export interface GetShardsResponse {
    id: number;
    shards: ShardInfo[];
    stats: ShardStats;
}

export interface ShardStats {
    shardCount: number;
    uptimeSecs: number;
}

export interface ShardInfo {
    id: number;
    ready: boolean;
    error: boolean;
    uptimeSecs?: number;
}

export class SetShardPresencesRequest {
    @IsDefined()
    @IsEnum(Constants.ActivityTypes)
    type: string;

    @IsDefined()
    @IsString()
    @Length(1, 128)
    name: string;

    @IsDefined()
    @IsUrl()
    url: string;
}
