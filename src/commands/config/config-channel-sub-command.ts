import { InvalidUtils, MessageUtils, PermissionUtils } from '../../utils';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(
        `Please specify an option!\n\n\`bday config channel create\` - Creates the default birthday channel.\n\`bday config channel clear\` - Clears the birthday channel.\n\`bday config channel #channel\` - Set the birthday channel.`
    )
    .setColor(Config.colors.error);

export class ConfigChannelSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (args[3].toLowerCase() === 'create') {
            // User wants to create the default birthday channel
            if (!msg.guild.me.hasPermission('MANAGE_CHANNELS')) {
                await InvalidUtils.notEnoughPermissions(msg.channel as TextChannel, [
                    'MANAGE_CHANNELS',
                ]);
                return;
            }

            // Create channel with desired attributes
            let birthdayChannel = await msg.guild.channels.create(
                `${Config.emotes.birthday} birthdays`,
                {
                    type: 'text',
                    topic: 'Birthday Announcements!',
                    permissionOverwrites: [
                        {
                            id: msg.guild.id,
                            deny: ['SEND_MESSAGES'],
                            allow: ['VIEW_CHANNEL'],
                        },
                        {
                            id: msg.guild.me.roles.cache.filter(role => role.managed).first(),
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                        },
                    ],
                }
            );

            await this.guildRepo.updateBirthdayChannel(msg.guild.id, birthdayChannel?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully created the birthday channel ${birthdayChannel.toString()}!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else if (args[3].toLowerCase() === 'clear') {
            // User wants to clear the birthday channel

            // Clear the birthday channel
            await this.guildRepo.updateBirthdayChannel(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the birthday channel!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else {
            // See if a channel was specified

            let birthdayChannel: TextChannel = msg.mentions.channels.first();

            // If could not find in mention check, try to find by name
            if (!birthdayChannel) {
                birthdayChannel = msg.guild.channels.cache
                    .filter(channel => channel instanceof TextChannel)
                    .map(channel => channel as TextChannel)
                    .find(channel => channel.name.toLowerCase().includes(args[3].toLowerCase()));
            }

            // Could it find the channel in either check?
            if (!birthdayChannel) {
                await MessageUtils.send(channel, errorEmbed);
                return;
            }

            // Bot needs to be able to message in the desired channel
            if (!PermissionUtils.canSend(birthdayChannel)) {
                await InvalidUtils.cantSendInChannel(msg.channel as TextChannel, birthdayChannel, [
                    'VIEW_CHANNEL',
                    'SEND_MESSAGES',
                    'EMBED_LINKS',
                    'ADD_REACTIONS',
                ]);
                return;
            }

            await this.guildRepo.updateBirthdayChannel(msg.guild.id, birthdayChannel?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set the birthday channel to ${birthdayChannel.toString()}!`
                )
                .setColor(Config.colors.success);

            await MessageUtils.send(channel, embed);
        }
    }
}
