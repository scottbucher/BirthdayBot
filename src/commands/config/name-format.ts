import {
    ChatInputApplicationCommandData,
    CommandInteraction,
    Message,
    PermissionString,
} from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class NameFormatSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('settingType.nameFormat'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let nameFormat: string;
        let guildMember = intr.guild.members.resolve(intr.user.id);
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;

        if (!reset) {
            // prompt them for a setting
            let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            let _prompt = await InteractionUtils.send(
                intr,
                Lang.getEmbed('prompts', 'config.nameFormat', data.lang(), {
                    MENTION: intr.user.toString(),
                    USERNAME: intr.user.username,
                    NICKNAME: guildMember.displayName,
                    TAG: `${intr.user.username}#${intr.user.discriminator}`,
                })
            );

            nameFormat = await collect(async (nextMsg: Message) => {
                let input = FormatUtils.extractNameFormatType(nextMsg.content.toLowerCase());
                if (!input) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                    );
                    return;
                }

                return input.toLowerCase();
            });
            if (nameFormat === undefined) return;
        } else nameFormat = 'default';

        if (nameFormat === 'default') nameFormat = 'mention';

        await this.guildRepo.updateNameFormat(intr.guild.id, nameFormat);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.nameFormatSet', data.lang(), {
                SETTING: nameFormat,
                FORMAT:
                    nameFormat === 'mention'
                        ? intr.user.toString()
                        : nameFormat === 'nickname'
                        ? guildMember.displayName
                        : nameFormat === 'username'
                        ? intr.user.username
                        : `${intr.user.username}#${intr.user.discriminator}`,
            })
        );
    }
}
