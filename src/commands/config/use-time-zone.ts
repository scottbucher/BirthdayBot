import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, MessageUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class UseTimezoneSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('settingType.useTimezone'),
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
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let useTimezone: string;

        if (!reset) {
            // prompt them for a setting
            let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            let _prompt = await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('prompts', 'config.useTimezone', data.lang())
            );

            useTimezone = await collect(async (nextMsg: Message) => {
                let input = FormatUtils.extractMiscActionType(nextMsg.content)?.toLowerCase() ?? '';

                if (input !== 'user' && input !== 'server') {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                    );
                    return;
                }

                return input.toLowerCase();
            });
            if (useTimezone === undefined) return;
        } else useTimezone = 'server';

        await this.guildRepo.updateUseTimezone(intr.guild.id, useTimezone);
        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.useTimeZoneSettingSet', data.lang(), {
                OPTION: useTimezone,
            })
        );
    }
}
