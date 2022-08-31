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
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        };

        if (!reset) {
            // prompt them for a setting

            let nameFormatPrompt = await InteractionUtils.sendWithEnterResponseButton(
                nextIntr,
                data,
                Lang.getEmbed('prompts', 'config.nameFormat', data.lang(), {
                    MENTION: intr.user.toString(),
                    USERNAME: intr.user.username,
                    NICKNAME: guildMember.displayName,
                    TAG: `${intr.user.username}#${intr.user.discriminator}`,
                })
            );

            let nameFormatResult = await CollectorUtils.collectByModal(
                nameFormatPrompt,
                new Modal({
                    customId: 'modal', // Will be overwritten
                    title: Lang.getRef('info', 'terms.nameFormat', data.lang()),
                    components: [
                        {
                            type: 'ACTION_ROW',
                            components: [
                                {
                                    type: 'TEXT_INPUT',
                                    customId: 'nameFormat',
                                    label: Lang.getRef('info', 'terms.nameFormat', data.lang()),
                                    required: true,
                                    style: 'SHORT',
                                    minLength: 1,
                                    placeholder: Lang.getRef('info', 'types.nickname', data.lang()),
                                },
                            ],
                        },
                    ],
                }),
                intr.user,
                async (intr: ModalSubmitInteraction) => {
                    let input = intr.components[0].components[0].value.toLowerCase();
                    let givenNameFormat = FormatUtils.extractNameFormatType(input);
                    if (!givenNameFormat) {
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

                    return { intr, value: givenNameFormat };
                },
                expireFunction
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
