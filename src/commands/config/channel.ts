import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    PermissionString,
    TextBasedChannel,
} from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import {
    ClientUtils,
    CollectorUtils,
    FormatUtils,
    InteractionUtils,
    PermissionUtils,
} from '../../utils/index.js';
import { Command } from '../index.js';

export class ChannelSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.channel'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL', 'MANAGE_CHANNELS'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type: string;
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;

        // prompt them for a type
        let _prompt = await InteractionUtils.send(
            intr,
            Lang.getEmbed('prompts', 'config.channelType', data.lang())
        );

        type = await CollectorUtils.collectByMessage(
            intr.channel,
            intr.user,
            async (nextMsg: Message) => {
                let input = FormatUtils.extractCelebrationType(nextMsg.content.toLowerCase());
                if (
                    !input ||
                    input === 'userSpecificBirthday' ||
                    input === 'userSpecificMemberAnniversary'
                ) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                    );
                    return;
                }

                return input;
            },
            async () => {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            }
        );

        if (type === undefined) return;

        let displayType = Lang.getRef('info', `terms.${type}`, data.lang());

        let channel: string;

        let nextIntr: CommandInteraction | ButtonInteraction = intr;

        if (!reset) {
            let guild = intr.guild;

            let promptEmbed = Lang.getEmbed('prompts', 'config.channel', data.lang(), {
                TYPE: displayType,
                TYPE_LOWERCASE: displayType.toLowerCase(),
                DOC_LINK: Lang.getCom(
                    `docLinks.whatIs${
                        type === 'birthday'
                            ? 'Birthday'
                            : type === 'memberAnniversary'
                            ? 'MemberAnniversary'
                            : 'ServerAnniversary'
                    }Channel`
                ),
            });

            let channelResult = await CollectorUtils.getSetupChoiceFromButton(
                intr,
                data,
                promptEmbed
            );

            if (channelResult === undefined) return;

            switch (channelResult.value) {
                case 'create': {
                    let title = Lang.getRef('info', `defaults.${type}ChannelName`, data.lang());
                    let topic = Lang.getRef('info', `defaults.${type}ChannelTopic`, data.lang());
                    // Create channel with desired attributes
                    channel = (
                        await guild.channels.create(title, {
                            type: 'GUILD_TEXT',
                            topic,
                            permissionOverwrites: [
                                {
                                    id: guild.id,
                                    deny: ['SEND_MESSAGES'],
                                    allow: ['VIEW_CHANNEL'],
                                },
                                {
                                    id: guild.me.roles.cache.filter(role => role.managed)?.first()
                                        ?.id,
                                    allow: [
                                        'VIEW_CHANNEL',
                                        'SEND_MESSAGES',
                                        'EMBED_LINKS',
                                        'ADD_REACTIONS',
                                        'READ_MESSAGE_HISTORY',
                                    ],
                                },
                            ],
                        })
                    )?.id;
                    await InteractionUtils.send(
                        intr,
                        Lang.getSuccessEmbed(
                            'results',
                            'successEmbeds.channelCreate',
                            data.lang(),
                            {
                                CHANNEL: `<#${channel}>`,
                            }
                        )
                    );
                    break;
                }
                case 'select': {
                    let _selectMessage = await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('prompts', 'setup.inputChannel', data.lang())
                    );

                    channel = await CollectorUtils.collectByMessage(
                        intr.channel,
                        intr.user,
                        async (nextMsg: Message) => {
                            // Find mentioned channel
                            let channelInput: TextBasedChannel = await ClientUtils.findTextChannel(
                                intr.guild,
                                nextMsg.content
                            );

                            if (!channelInput) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getErrorEmbed(
                                        'validation',
                                        'errorEmbeds.invalidChannel',
                                        data.lang()
                                    )
                                );
                                return;
                            }

                            // Bot needs to be able to message in the desired channel
                            if (!PermissionUtils.canSend(channelInput)) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getEmbed(
                                        'validation',
                                        'embeds.noAccessToChannel',
                                        data.lang(),
                                        {
                                            CHANNEL: channelInput.toString(),
                                        }
                                    )
                                );
                                return;
                            }
                            return channelInput?.id;
                        },
                        async () => {
                            await InteractionUtils.send(
                                intr,
                                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                            );
                        }
                    );

                    if (channel === undefined) {
                        return;
                    }
                    await InteractionUtils.send(
                        intr,
                        Lang.getSuccessEmbed('results', 'successEmbeds.channelSet', data.lang(), {
                            CHANNEL: `<#${channel}>`,
                            TYPE: displayType.toLowerCase(),
                        })
                    );
                    break;
                }
                case 'deny': {
                    channel = '0';
                    break;
                }
            }
            nextIntr = channelResult.intr;
        } else channel = '0';

        if (channel === '0') {
            await InteractionUtils.send(
                nextIntr,
                Lang.getSuccessEmbed('results', 'successEmbeds.channelClear', data.lang(), {
                    TYPE: displayType.toLowerCase(),
                })
            );
        }

        // Save the channel
        type === 'birthday'
            ? await this.guildRepo.updateBirthdayChannel(intr.guild.id, channel)
            : type === 'memberAnniversary'
            ? await this.guildRepo.updateMemberAnniversaryChannel(intr.guild.id, channel)
            : await this.guildRepo.updateServerAnniversaryChannel(intr.guild.id, channel);
    }
}
