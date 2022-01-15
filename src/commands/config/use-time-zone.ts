import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';
import { Command } from '../command';

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

            let prompt = await MessageUtils.sendIntr(
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
