import { CommandInteraction, Message } from 'discord.js';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

export class UseTimezoneSubCommand {
    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData, reset: boolean): Promise<void> {
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
            Lang.getEmbed('results', 'success.useTimeZoneSettingSet', data.lang(), {
                OPTION: useTimezone,
            })
        );
    }
}
