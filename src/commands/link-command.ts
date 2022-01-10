import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import {
    ApplicationCommandData,
    CommandInteraction,
    MessageEmbed,
    PermissionString,
} from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class LinkCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.link'),
        description: 'Useful links for the bot.',
        options: [
            {
                name: 'link',
                description: 'Link to display.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'docs',
                        value: 'docs',
                    },
                    {
                        name: 'faq',
                        value: 'faq',
                    },
                    {
                        name: 'donate',
                        value: 'donate',
                    },
                    {
                        name: 'invite',
                        value: 'invite',
                    },
                    {
                        name: 'support',
                        value: 'support',
                    },
                    {
                        name: 'vote',
                        value: 'vote',
                    },
                    {
                        name: 'map',
                        value: 'map',
                    },
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let link = intr.options.getString('link');
        let embed: MessageEmbed;
        switch (link) {
            case 'docs': {
                embed = Lang.getEmbed('info', 'embeds.docs', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'faq': {
                embed = Lang.getEmbed('info', 'embeds.faq', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'donate': {
                embed = Lang.getEmbed('info', 'embeds.donate', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'invite': {
                embed = Lang.getEmbed('info', 'embeds.invite', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'support': {
                embed = Lang.getEmbed('info', 'embeds.support', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'vote': {
                embed = Lang.getEmbed('info', 'embeds.vote', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'map': {
                embed = Lang.getEmbed('info', 'embeds.map', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            default: {
                return;
            }
        }

        await MessageUtils.sendIntr(intr, embed);
    }
}
