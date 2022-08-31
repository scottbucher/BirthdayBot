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

export class UseTimezoneSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.useTimezone'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let useTimezone: string;
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
            let useTimeZonePrompt = await InteractionUtils.sendWithEnterResponseButton(
                nextIntr,
                data,
                Lang.getEmbed('prompts', 'config.useTimezone', data.lang())
            );

            let useTimezoneResult = await CollectorUtils.collectByModal(
                useTimeZonePrompt,
                new Modal({
                    customId: 'modal', // Will be overwritten
                    title: Lang.getRef('info', 'terms.useTimezone', data.lang()),
                    components: [
                        {
                            type: 'ACTION_ROW',
                            components: [
                                {
                                    type: 'TEXT_INPUT',
                                    customId: 'useTimezone',
                                    label: Lang.getRef('info', 'terms.useTimezone', data.lang()),
                                    required: true,
                                    style: 'SHORT',
                                    minLength: 4,
                                    maxLength: 6,
                                    placeholder: Lang.getRef('info', 'terms.user', data.lang()),
                                },
                            ],
                        },
                    ],
                }),
                intr.user,
                async (intr: ModalSubmitInteraction) => {
                    let input = intr.components[0].components[0].value;

                    let givenSetting =
                        FormatUtils.extractMiscActionType(input)?.toLowerCase() ?? '';

                    if (givenSetting !== 'user' && givenSetting !== 'server') {
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

            if (useTimezoneResult === undefined) return;
            nextIntr = useTimezoneResult.intr;
            useTimezone = useTimezoneResult.value;
        } else useTimezone = 'server';

        await this.guildRepo.updateUseTimezone(intr.guild.id, useTimezone);
        await InteractionUtils.send(
            nextIntr,
            Lang.getSuccessEmbed('results', 'successEmbeds.useTimeZoneSettingSet', data.lang(), {
                OPTION: useTimezone,
            })
        );
    }
}
