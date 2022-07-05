import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class HelpCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.help'),
        description: 'The help command.',
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                name: Lang.getCom('arguments.category'),
                description: 'Help category to display.',
                required: false,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'general',
                        value: 'general',
                    },
                    {
                        name: 'blacklist',
                        value: 'blacklist',
                    },
                    {
                        name: 'config',
                        value: 'config',
                    },
                    {
                        name: 'message',
                        value: 'message',
                    },
                    {
                        name: 'trusted_role',
                        value: 'trusted_role',
                    },
                    {
                        name: 'member_anniversary_role',
                        value: 'member_anniversary_role',
                    },
                    {
                        name: 'premium',
                        value: 'premium',
                    },
                    {
                        name: 'permissions',
                        value: 'permissions',
                    },
                ],
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let link = intr.options.getString(Lang.getCom('arguments.category')) ?? 'general';
        let embed: MessageEmbed;
        switch (link) {
            case 'general': {
                embed = Lang.getEmbed('info', 'help.general', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'blacklist': {
                embed = Lang.getEmbed('info', 'help.blacklist', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'config': {
                embed = Lang.getEmbed('info', 'help.config', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'message': {
                embed = Lang.getEmbed('info', 'help.message', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'trusted_role': {
                embed = Lang.getEmbed('info', 'help.trusted', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'member_anniversary_role': {
                embed = Lang.getEmbed('info', 'help.mar', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'premium': {
                embed = Lang.getEmbed('info', 'help.premium', data.lang(), {
                    BOT: intr.client.user.toString(),
                    ICON: intr.client.user.displayAvatarURL(),
                });
                break;
            }
            case 'permissions': {
                embed = Lang.getEmbed('info', 'help.permissions', data.lang());
                break;
            }
            default: {
                return;
            }
        }

        await InteractionUtils.send(intr, embed);
    }
}
