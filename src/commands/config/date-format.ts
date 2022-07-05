import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, Message, PermissionString } from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class DateFormatSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.dateFormat'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let dateFormat: string;
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;

        if (!reset) {
            // prompt them for a setting
            let _prompt = await InteractionUtils.send(
                intr,
                Lang.getEmbed('prompts', 'config.dateFormat', data.lang())
            );

            dateFormat = await CollectorUtils.collectByMessage(
                intr.channel,
                intr.user,
                async (nextMsg: Message) => {
                    let input = FormatUtils.extractDateFormatType(nextMsg.content)?.toLowerCase();
                    if (!input) {
                        await InteractionUtils.send(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.invalidSetting',
                                data.lang()
                            )
                        );
                        return;
                    }

                    return input.toLowerCase();
                },
                async () => {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                    );
                }
            );

            if (dateFormat === undefined) return;
        } else dateFormat = 'month_day';

        await this.guildRepo.updateDateFormat(intr.guild.id, dateFormat);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.dateFormatSet', data.lang(), {
                SETTING: Lang.getRef(
                    'info',
                    `types.${dateFormat === 'month_day' ? 'monthDay' : 'dayMonth'}`,
                    data.lang()
                ),
            })
        );
    }
}
