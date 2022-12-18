import djs, { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';
import { filesize } from 'filesize';
import { info } from 'node:console';
import { createRequire } from 'node:module';
import os from 'node:os';
import typescript from 'typescript';

import { DataValidation, EventDataType, InfoOption } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { ShardUtils } from '../../utils/shard-utils.js';
import { Command, CommandDeferType } from '../command.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');
let TsConfig = require('../../../tsconfig.json');

export class InfoCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.info', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let option = intr.options.getString(
            Lang.getRef('commands', 'arguments.option', Language.Default)
        );

        let embed: EmbedBuilder;
        switch (option) {
            case InfoOption.ABOUT: {
                embed = Lang.getEmbed('info', 'embeds.info', data.lang);
                break;
            }
            case InfoOption.DEV: {
                if (!Config.developers.includes(intr.user.id)) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'embeds.devOnly', data.lang)
                    );
                    return;
                }

                let shardCount = intr.client.shard?.count ?? 1;
                let serverCount: number;
                if (intr.client.shard) {
                    try {
                        serverCount = await ShardUtils.serverCount(intr.client.shard);
                    } catch (error) {
                        // SHARDING_IN_PROCESS: Shards are still being spawned.
                        if (error.name.includes('SHARDING_IN_PROCESS')) {
                            await InteractionUtils.send(
                                intr,
                                Lang.getEmbed('info', 'embeds.startupInProcess', data.lang)
                            );
                            return;
                        } else {
                            throw error;
                        }
                    }
                } else {
                    serverCount = intr.client.guilds.cache.size;
                }

                let memory = process.memoryUsage();
                embed = Lang.getEmbed('info', 'embeds.dev', data.lang, {
                    NODE_VERSION: process.version,
                    TS_VERSION: `v${typescript.version}`,
                    ES_VERSION: TsConfig.compilerOptions.target,
                    DJS_VERSION: `v${djs.version}`,
                    SHARD_COUNT: shardCount.toLocaleString(),
                    SERVER_COUNT: serverCount.toLocaleString(),
                    SERVER_COUNT_PER_SHARD: Math.round(serverCount / shardCount).toLocaleString(),
                    RSS_SIZE: filesize(memory.rss) as string,
                    RSS_SIZE_PER_SERVER:
                        serverCount > 0
                            ? (filesize(memory.rss / serverCount) as string)
                            : Lang.getRef('info', 'other.na', data.lang),
                    HEAP_TOTAL_SIZE: filesize(memory.heapTotal) as string,
                    HEAP_TOTAL_SIZE_PER_SERVER:
                        serverCount > 0
                            ? (filesize(memory.heapTotal / serverCount) as string)
                            : Lang.getRef('info', 'other.na', data.lang),
                    HEAP_USED_SIZE: filesize(memory.heapUsed) as string,
                    HEAP_USED_SIZE_PER_SERVER:
                        serverCount > 0
                            ? (filesize(memory.heapUsed / serverCount) as string)
                            : Lang.getRef('info', 'other.na', data.lang),
                    HOSTNAME: os.hostname(),
                    SHARD_ID: (intr.guild?.shardId ?? 0).toString(),
                    SERVER_ID: intr.guild?.id ?? Lang.getRef('info', 'other.na', data.lang),
                    BOT_ID: intr.client.user?.id,
                    USER_ID: intr.user.id,
                });
                break;
            }
            default: {
                return;
            }
        }

        await InteractionUtils.send(intr, embed);
    }
}
