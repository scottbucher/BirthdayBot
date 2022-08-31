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

export class TimezoneSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.timeZone'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let timeZone: string;
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
            let serverTimeZonePrompt = await InteractionUtils.sendWithEnterResponseButton(
                nextIntr,
                data,
                Lang.getEmbed('prompts', 'config.timezone', data.lang(), {
                    MENTION: intr.user.toString(),
                })
            );

            let timeZoneResult = await CollectorUtils.collectByModal(
                serverTimeZonePrompt,
                new Modal({
                    customId: 'modal', // Will be overwritten
                    title: Lang.getRef('info', 'terms.defaultTimezone', data.lang()),
                    components: [
                        {
                            type: 'ACTION_ROW',
                            components: [
                                {
                                    type: 'TEXT_INPUT',
                                    customId: 'defaultTimeZone',
                                    label: Lang.getRef(
                                        'info',
                                        'terms.defaultTimezone',
                                        data.lang()
                                    ),
                                    required: true,
                                    style: 'SHORT',
                                    minLength: 1,
                                    placeholder: Lang.getRef(
                                        'info',
                                        'terms.newYorkTimezone',
                                        data.lang()
                                    ),
                                },
                            ],
                        },
                    ],
                }),
                intr.user,
                async (intr: ModalSubmitInteraction) => {
                    let input = intr.components[0].components[0].value;

                    if (FormatUtils.checkAbbreviation(input)) {
                        await InteractionUtils.send(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.timezoneAbbreviation',
                                data.lang()
                            )
                        );
                        return;
                    }

                    let givenTimeZone = FormatUtils.findZone(input); // Try and get the time zone
                    if (!givenTimeZone) {
                        await InteractionUtils.send(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.invalidTimezone',
                                data.lang()
                            )
                        );
                        return;
                    }

                    return { intr, value: givenTimeZone };
                },
                expireFunction
            );

            if (timeZoneResult === undefined) return;
            nextIntr = timeZoneResult.intr;
            timeZone = timeZoneResult.value;
        } else timeZone = '0';

        if (timeZone === 'clear') timeZone = '0';

        await this.guildRepo.updateDefaultTimezone(intr.guild.id, timeZone);

        await InteractionUtils.send(
            nextIntr,
            timeZone === '0'
                ? Lang.getSuccessEmbed('results', 'successEmbeds.defaultTimeCleared', data.lang())
                : Lang.getSuccessEmbed('results', 'successEmbeds.defaultTimeZoneSet', data.lang(), {
                      TIMEZONE: timeZone,
                  })
        );
    }
}
