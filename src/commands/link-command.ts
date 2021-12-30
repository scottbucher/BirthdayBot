import { ApplicationCommandData, CommandInteraction, MessageEmbed } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

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
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let link = intr.options.getString('link');

        let embed: MessageEmbed;
        switch (link) {
            case 'docs': {
                // embed = Lang.getEmbed('embeds.linkDocs', data.lang());
                break;
            }
            case 'donate': {
                // embed = Lang.getEmbed('embeds.linkDonate', data.lang());
                break;
            }
            case 'invite': {
                // embed = Lang.getEmbed('embeds.linkInvite', data.lang());
                break;
            }
            case 'support': {
                // embed = Lang.getEmbed('embeds.linkSupport', data.lang());
                break;
            }
            case 'vote': {
                // embed = Lang.getEmbed('embeds.linkVote', data.lang());
                break;
            }
            default: {
                return;
            }
        }

        await MessageUtils.sendIntr(intr, embed);
    }
}
