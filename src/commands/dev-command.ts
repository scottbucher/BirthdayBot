import djs, { DMChannel, Message, TextChannel } from 'discord.js';
import typescript from 'typescript';

import { LangCode } from '../models/enums';
import { Lang } from '../services';
import { MathUtils, MessageUtils } from '../utils';
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
        let memory = process.memoryUsage();
        await MessageUtils.send(
            msg.channel,
            Lang.getEmbed('dev.general', LangCode.EN, {
                NODE_VERSION: process.version,
                TS_VERSION: `v${typescript.version}`,
                ES_VERSION: TsConfig.compilerOptions.target,
                DJS_VERSION: `v${djs.version}`,
                SHARD_ID: (msg.guild?.shardID ?? 0).toString(),
                SERVER_ID: msg.guild?.id ?? Lang.getRef('terms.na', LangCode.EN),
                USER_ID: msg.author.id,
                RSS_SIZE: `${MathUtils.bytesToMB(memory.rss)} MB`,
                HEAP_TOTAL_SIZE: `${MathUtils.bytesToMB(memory.heapTotal)} MB`,
                HEAP_USED_SIZE: `${MathUtils.bytesToMB(memory.heapUsed)} MB`,
            })
        );
    }
}
