import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    BaseCommandInteraction,
    ButtonInteraction,
    CommandInteraction,
    MessageActionRow,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    PermissionString,
} from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, InteractionUtils } from '../../utils/index.js';
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
        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;

        if (!reset) {
            let dateFormatPrompt = await InteractionUtils.send(nextIntr, {
                embeds: [Lang.getEmbed('prompts', 'config.dateFormat', data.lang())],
                components: [
                    {
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'BUTTON',
                                customId: 'month_day',
                                label: Lang.getRef('info', 'terms.monthDay', data.lang()),
                                style: 'PRIMARY',
                            },
                            {
                                type: 'BUTTON',
                                customId: 'day_month',
                                label: Lang.getRef('info', 'terms.dayMonth', data.lang()),
                                style: 'PRIMARY',
                            },
                        ],
                    },
                ],
            });

            let dateFormatResult = await CollectorUtils.collectByButton(
                dateFormatPrompt,
                nextIntr.user,
                async (intr: ButtonInteraction) => {
                    try {
                        await InteractionUtils.deferAndDisableButtons(intr);
                    } catch (error) {
                        try {
                            await InteractionUtils.editReply(intr, {
                                components: InteractionUtils.setComponentsStatus(
                                    intr.message.components as MessageActionRow[],
                                    true
                                ),
                            });
                        } catch (error) {
                            return;
                        }
                        return;
                    }

                    return {
                        intr,
                        value: intr.customId,
                    };
                },
                async () => {
                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                    );
                }
            );

            if (dateFormatResult === undefined) return;
            nextIntr = dateFormatResult.intr;
            dateFormat = dateFormatResult.value;
        } else dateFormat = 'month_day';

        await this.guildRepo.updateDateFormat(intr.guild.id, dateFormat);

        await InteractionUtils.send(
            nextIntr,
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
