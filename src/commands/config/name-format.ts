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

export class NameFormatSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.nameFormat'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let nameFormat: string;
        let guildMember = intr.guild.members.resolve(intr.user.id);
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;

        if (!reset) {
            // prompt them for a setting
            let nameFormatPrompt = await InteractionUtils.send(nextIntr, {
                embeds: [
                    Lang.getEmbed('prompts', 'config.nameFormat', data.lang(), {
                        MENTION: intr.user.toString(),
                        USERNAME: intr.user.username,
                        NICKNAME: guildMember.displayName,
                        TAG: `${intr.user.username}#${intr.user.discriminator}`,
                    }),
                ],
                components: [
                    {
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'BUTTON',
                                customId: 'mention',
                                label: Lang.getRef('info', 'terms.mention', data.lang()),
                                style: 'PRIMARY',
                            },
                            {
                                type: 'BUTTON',
                                customId: 'username',
                                label: Lang.getRef('info', 'terms.username', data.lang()),
                                style: 'PRIMARY',
                            },
                            {
                                type: 'BUTTON',
                                customId: 'nickname',
                                label: Lang.getRef('info', 'terms.nickname', data.lang()),
                                style: 'PRIMARY',
                            },
                            {
                                type: 'BUTTON',
                                customId: 'tag',
                                label: Lang.getRef('info', 'terms.tag', data.lang()),
                                style: 'PRIMARY',
                            },
                        ],
                    },
                ],
            });

            let nameFormatResult = await CollectorUtils.collectByButton(
                nameFormatPrompt,
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

            if (nameFormatResult === undefined) return;
            nextIntr = nameFormatResult.intr;
            nameFormat = nameFormatResult.value;
        } else nameFormat = 'default';

        if (nameFormat === 'default') nameFormat = 'mention';

        await this.guildRepo.updateNameFormat(intr.guild.id, nameFormat);

        await InteractionUtils.send(
            nextIntr,
            Lang.getSuccessEmbed('results', 'successEmbeds.nameFormatSet', data.lang(), {
                SETTING: nameFormat,
                FORMAT:
                    nameFormat === 'mention'
                        ? intr.user.toString()
                        : nameFormat === 'nickname'
                        ? guildMember.displayName
                        : nameFormat === 'username'
                        ? intr.user.username
                        : `${intr.user.username}#${intr.user.discriminator}`,
            })
        );
    }
}
