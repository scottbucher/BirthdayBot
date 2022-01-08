import {
    ApplicationCommandData,
    CommandInteraction,
    Message,
    MessageReaction,
    PermissionString,
    Role,
    TextBasedChannel,
    User,
} from 'discord.js';
import { GuildUtils, MessageUtils, PermissionUtils } from '../utils';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { GuildRepo } from '../services/database/repos';
import { CollectorUtils } from '../utils/collector-utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class SetupCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.setup'),
        description: 'Run the initial setup processes.',
    };
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [
        'ADD_REACTIONS',
        'VIEW_CHANNEL',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
    ];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let guild = intr.guild;
        let botUser = guild.client.user;
        // if the guild has a timezone, and their inputted timezone isn't already the guild's timezone
        let collectReact = CollectorUtils.createReactCollect(intr.user, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        });
        let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        });

        let birthdayChannel: string;
        let birthdayRole: string;

        let channelEmbed = Lang.getEmbed('prompts', 'setup.birthdayChannel', data.lang(), {
            ICON: intr.client.user.displayAvatarURL(),
        }).setAuthor({ name: `${guild.name}`, url: guild.iconURL() });

        let reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

        let channelMessage = await MessageUtils.sendIntr(intr, channelEmbed);
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
                // Create channel with desired attributes
                birthdayChannel = (
                    await guild.channels.create(
                        Lang.getRef('info', 'defaults.birthdayChannelName', data.lang()),
                        {
                            type: 'GUILD_TEXT',
                            topic: Lang.getRef(
                                'info',
                                'defaults.birthdayChannelTopic',
                                data.lang()
                            ),
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
                        }
                    )
                )?.id;
                break;
            }
            case Config.emotes.select: {
                let selectMessage = await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('prompts', 'setup.inputChannel', data.lang())
                );

                birthdayChannel = await collect(async (nextMsg: Message) => {
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
                            Lang.getEmbed('validation', 'embeds..noAccessToChannel', data.lang(), {
                                CHANNEL: channelInput.toString(),
                            })
                        );
                        return;
                    }
                    return channelInput?.id;
                });

                if (birthdayChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                birthdayChannel = '0';
                break;
            }
        }

        let roleEmbed = Lang.getEmbed('prompts', 'setup.birthdayRole', data.lang(), {
            ICON: intr.client.user.displayAvatarURL(),
        }).setAuthor({ name: `${guild.name}`, url: guild.iconURL() });

        let roleMessage = await MessageUtils.sendIntr(intr, roleEmbed);
        for (let reactOption of reactOptions) {
            await MessageUtils.react(roleMessage, reactOption);
        }

        let roleOptions: boolean = await collectReact(
            roleMessage,
            async (msgReaction: MessageReaction, reactor: User) => {
                if (!reactOptions.includes(msgReaction.emoji.name)) return;
                return msgReaction.emoji.name;
            }
        );

        if (roleOptions === undefined) return;

        switch (roleOptions) {
            case Config.emotes.create: {
                // Create role with desired attributes
                birthdayRole = (
                    await guild.roles.create({
                        name: Config.emotes.birthday,
                        color: Config.colors.role,
                        hoist: true,
                        mentionable: true,
                    })
                )?.id;
                break;
            }
            case Config.emotes.select: {
                let selectMessage = await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('prompts', 'setup.inputRole', data.lang())
                );

                birthdayRole = await collect(async (nextMsg: Message) => {
                    // Find mentioned role
                    let roleInput: Role = nextMsg.mentions.roles.first();

                    // Search guild for role
                    if (!roleInput) {
                        roleInput = guild.roles.cache.find(role =>
                            role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
                        );
                    }

                    // If it couldn't find the role, the role was in another guild, or the role the everyone role
                    if (
                        !roleInput ||
                        roleInput.id === guild.id ||
                        nextMsg?.content.toLowerCase() === 'everyone'
                    ) {
                        MessageUtils.sendIntr(
                            intr,
                            Lang.getErrorEmbed('validation', 'errorEmbeds.invalidRole', data.lang())
                        );
                        return;
                    }

                    // Check the role's position
                    if (
                        roleInput.position > guild.members.resolve(botUser).roles.highest.position
                    ) {
                        await MessageUtils.sendIntr(
                            intr,
                            Lang.getEmbed('validation', 'embeds.roleHierarchyError', data.lang(), {
                                BOT: intr.client.user.toString(),
                                ICON: intr.client.user.displayAvatarURL(),
                            })
                        );
                        return;
                    }

                    // Check if the role is managed
                    if (roleInput.managed) {
                        MessageUtils.sendIntr(
                            intr,
                            Lang.getErrorEmbed(
                                'validation',
                                'errorEmbeds.birthdayRoleManaged',
                                data.lang()
                            )
                        );
                        return;
                    }

                    let membersWithRole = roleInput.members.size;

                    if (membersWithRole > 0 && membersWithRole < 100) {
                        await MessageUtils.sendIntr(
                            intr,
                            Lang.getEmbed(
                                'validation',
                                'embeds.birthdayRoleUsedWarning',
                                data.lang(),
                                {
                                    AMOUNT: membersWithRole.toString(),
                                    S_Value: membersWithRole > 1 ? 's' : '',
                                    ICON: intr.client.user.displayAvatarURL(),
                                }
                            )
                        );
                    } else if (membersWithRole > 100) {
                        await MessageUtils.sendIntr(
                            intr,
                            Lang.getEmbed(
                                'validation',
                                'embeds.birthdayRoleUsedError',
                                data.lang(),
                                {
                                    AMOUNT: membersWithRole.toString(),
                                    ICON: intr.client.user.displayAvatarURL(),
                                }
                            )
                        );
                        return;
                    }

                    return roleInput?.id;
                });

                if (birthdayRole === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                birthdayRole = '0';
                break;
            }
        }

        let channelOutput =
            birthdayChannel === '0'
                ? `${Lang.getRef('info', 'terms.notSet', data.lang())}`
                : guild.channels.resolve(birthdayChannel)?.toString() ||
                  `**${Lang.getRef('info', 'terms.unknownChannel', data.lang())}**`;
        let roleOutput =
            birthdayRole === '0'
                ? `${Lang.getRef('info', 'terms.notSet', data.lang())}`
                : guild.roles.resolve(birthdayRole)?.toString() ||
                  `**${Lang.getRef('info', 'terms.unknownRole', data.lang())}**`;

        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('results', 'success.requiredSetup', data.lang(), {
                CHANNEL: channelOutput,
                ROLE: roleOutput,
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        await this.guildRepo.addOrUpdateGuild(guild.id, birthdayChannel, birthdayRole);
    }
}
