import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    BaseCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    Modal,
    ModalSubmitInteraction,
    PermissionString,
} from 'discord.js';
import { ExpireFunction } from 'discord.js-collector-utils';

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
        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        };

        if (!reset) {
            let dateFormatPrompt = await InteractionUtils.sendWithEnterResponseButton(
                nextIntr,
                data,
                Lang.getEmbed('prompts', 'config.dateFormat', data.lang())
            );

            let dateFormatResult = await CollectorUtils.collectByModal(
                dateFormatPrompt,
                new Modal({
                    customId: 'modal', // Will be overwritten
                    title: Lang.getRef('info', 'terms.dateFormat', data.lang()),
                    components: [
                        {
                            type: 'ACTION_ROW',
                            components: [
                                {
                                    type: 'TEXT_INPUT',
                                    customId: 'dateFormat',
                                    label: Lang.getRef('info', 'terms.dateFormat', data.lang()),
                                    required: true,
                                    style: 'SHORT',
                                    minLength: 1,
                                    placeholder: Lang.getRef('info', 'types.dayMonth', data.lang()),
                                },
                            ],
                        },
                    ],
                }),
                intr.user,
                async (intr: ModalSubmitInteraction) => {
                    let input = intr.components[0].components[0].value;
                    let givenSetting = FormatUtils.extractDateFormatType(input)?.toLowerCase();
                    if (!givenSetting) {
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

                    return { intr, value: givenSetting.toLowerCase() };
                },
                expireFunction
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
