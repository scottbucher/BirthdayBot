import djs, { DMChannel, Message, TextChannel } from 'discord.js';
import fileSize from 'filesize';
import typescript from 'typescript';

import { LangCode } from '../models/enums';
import { Lang } from '../services';
import { MessageUtils, ShardUtils } from '../utils';
import { Command } from './command';

let TsConfig = require('../../tsconfig.json');

export class DevCommand implements Command {
    public name: string = 'dev';
    public aliases = ['developer', 'usage', 'memory', 'mem'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let shardCount = msg.client.shard?.count ?? 1;
        let serverCount: number;
        if (msg.client.shard) {
            try {
                serverCount = await ShardUtils.serverCount(msg.client.shard);
            } catch (error) {
                // SHARDING_IN_PROCESS: Shards are still being spawned.
                if (error.name.includes('SHARDING_IN_PROCESS')) {
                    await MessageUtils.send(
                        msg.channel,
                        Lang.getEmbed('errors.startupInProcess', LangCode.EN_US)
                    );
                    return;
                } else {
                    throw error;
                }
            }
        } else {
            serverCount = msg.client.guilds.cache.size;
        }

        let memory = process.memoryUsage();
        await MessageUtils.send(
            msg.channel,
            Lang.getEmbed('dev.general', LangCode.EN_US, {
                NODE_VERSION: process.version,
                TS_VERSION: `v${typescript.version}`,
                ES_VERSION: TsConfig.compilerOptions.target,
                DJS_VERSION: `v${djs.version}`,
                SHARD_COUNT: shardCount.toLocaleString(),
                SERVER_COUNT: serverCount.toLocaleString(),
                RSS_SIZE: fileSize(memory.rss),
                RSS_SIZE_PER_SERVER:
                    serverCount > 0
                        ? fileSize(memory.rss / serverCount)
                        : Lang.getRef('terms.na', LangCode.EN_US),
                HEAP_TOTAL_SIZE: fileSize(memory.heapTotal),
                HEAP_TOTAL_SIZE_PER_SERVER:
                    serverCount > 0
                        ? fileSize(memory.heapTotal / serverCount)
                        : Lang.getRef('terms.na', LangCode.EN_US),
                HEAP_USED_SIZE: fileSize(memory.heapUsed),
                HEAP_USED_SIZE_PER_SERVER:
                    serverCount > 0
                        ? fileSize(memory.heapUsed / serverCount)
                        : Lang.getRef('terms.na', LangCode.EN_US),
                SHARD_ID: (msg.guild?.shardID ?? 0).toString(),
                SERVER_ID: msg.guild?.id ?? Lang.getRef('other.na', LangCode.EN_US),
                BOT_ID: msg.client.user.id,
                USER_ID: msg.author.id,
            })
        );
    }
}
