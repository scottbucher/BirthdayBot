import { CommandInteraction, Message, MessageReaction, TextBasedChannel, User } from 'discord.js';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, GuildUtils, MessageUtils, PermissionUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

let Config = require('../../../config/config.json');

const reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

export class ChannelSubCommand {
    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData, reset: boolean): Promise<void> {
        let type: string;

        // prompt them for a type
        let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        });

        let prompt = await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('prompts', 'config.channelType', data.lang())
        );

        type = await collect(async (nextMsg: Message) => {
            let input = FormatUtils.extractCelebrationType(nextMsg.content.toLowerCase());
            if (
                !input ||
                input === 'userSpecificBirthday' ||
                input === 'userSpecificMemberAnniversary'
            ) {
                console.log(input);
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                );
                return;
            }

            return input;
        });
        if (type === undefined) return;

        let displayType = Lang.getRef('info', `terms.${type}`, data.lang());

        let channel: string;

        if (!reset) {
            let guild = intr.guild;
            let collectReact = CollectorUtils.createReactCollect(intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            let promptEmbed = Lang.getEmbed('prompts', `config.channel`, data.lang(), {
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

            let channelMessage = await MessageUtils.sendIntr(intr, promptEmbed);
            for (let reactOption of reactOptions) {
                await MessageUtils.react(channelMessage, reactOption);
            }

            let channelOption: boolean = await collectReact(
                channelMessage,
                async (msgReaction: MessageReaction, reactor: User) => {
                    if (!reactOptions.includes(msgReaction.emoji.name)) return;
                    return msgReaction.emoji.name;
                }
            );

            if (channelOption === undefined) return;

            switch (channelOption) {
                case Config.emotes.create: {
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
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getSuccessEmbed(
                            'results',
                            'successEmbeds.channelCreated',
                            data.lang(),
                            {
                                CHANNEL: `<#${channel}>`,
                            }
                        )
                    );
                    break;
                }
                case Config.emotes.select: {
                    let selectMessage = await MessageUtils.sendIntr(
                        intr,
                        Lang.getEmbed('prompts', 'setup.inputChannel', data.lang())
                    );

                    channel = await collect(async (nextMsg: Message) => {
                        // Find mentioned channel
                        let channelInput: TextBasedChannel =
                            GuildUtils.getMentionedTextChannel(nextMsg);

                        if (!channelInput) {
                            await MessageUtils.sendIntr(
                                intr,
                                Lang.getErrorEmbed(
                                    'validation',
                                    'errprEmbeds.invalidChannel',
                                    data.lang()
                                )
                            );
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(channelInput)) {
                            await MessageUtils.sendIntr(
                                intr,
                                Lang.getEmbed(
                                    'validation',
                                    'embeds..noAccessToChannel',
                                    data.lang(),
                                    {
                                        CHANNEL: channelInput.toString(),
                                    }
                                )
                            );
                            return;
                        }
                        return channelInput?.id;
                    });

                    if (channel === undefined) {
                        return;
                    }
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getSuccessEmbed('results', 'successEmbeds.channelSet', data.lang(), {
                            CHANNEL: `<#${channel}>`,
                            TYPE: displayType.toLowerCase(),
                        })
                    );
                    break;
                }
                case Config.emotes.deny: {
                    channel = '0';
                    break;
                }
            }
        } else channel = '0';

        if (channel === '0') {
            await MessageUtils.sendIntr(
                intr,
                Lang.getSuccessEmbed('results', 'successEmbeds.channelCleared', data.lang(), {
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
