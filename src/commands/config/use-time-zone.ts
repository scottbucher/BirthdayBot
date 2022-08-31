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

        if (!reset) {
            let useTimeZonePrompt = await InteractionUtils.send(nextIntr, {
                embeds: [Lang.getEmbed('prompts', 'config.useTimezone', data.lang())],
                components: [
                    {
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'BUTTON',
                                customId: 'user',
                                label: Lang.getRef('info', 'terms.user', data.lang()),
                                style: 'PRIMARY',
                            },
                            {
                                type: 'BUTTON',
                                customId: 'select',
                                label: Lang.getRef('info', 'terms.server', data.lang()),
                                style: 'PRIMARY',
                            },
                        ],
                    },
                ],
            });

            let useTimezoneResult = await CollectorUtils.collectByButton(
                useTimeZonePrompt,
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
