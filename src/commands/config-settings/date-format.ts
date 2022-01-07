import { CommandInteraction, Message } from 'discord.js';
import { EventData } from '../../models';
import { LangCode } from '../../models/enums';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

export class DateFormatSubCommand {
    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData, reset: boolean): Promise<void> {
        let dateFormat: string;

        if (!reset) {
            //prompt them for a setting
            let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            let prompt = await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('prompts', 'config.dateFormat', data.lang())
            );

            dateFormat = await collect(async (nextMsg: Message) => {
                let input = FormatUtils.extractDateFormatType(nextMsg.content)?.toLowerCase();
                if (!input) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                    );
                    return;
                }

                return input.toLowerCase();
            });
        } else dateFormat = 'day_month';

        await this.guildRepo.updateDateFormat(intr.guild.id, dateFormat);

        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('results', 'success.dateFormatSet', data.lang(), {
                SETTING: Lang.getRef(
                    'info',
                    `types.${dateFormat === 'month_day' ? 'monthDay' : 'dayMonth'}`,
                    data.lang()
                ),
            })
        );
    }
}
