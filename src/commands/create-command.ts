import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

export class CreateCommand implements Command {
    public name: string = 'create';
    public aliases = [];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    'Please specify what to create!\nAccepted Values: `channel`, `role`, `trustedRole`, `birthdayMasterRole`'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (args[2].toLowerCase() === 'channel') {
            if (!msg.guild.me.hasPermission('MANAGE_CHANNELS')) {
                let embed = new MessageEmbed()
                    .setTitle('Not Enough Permissions!')
                    .setDescription('The bot must have permission to manage channel!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
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
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'role') {
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                let embed = new MessageEmbed()
                    .setTitle('Not Enough Permissions!')
                    .setDescription('The bot must have permission to manage roles!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            // Create role with desired attributes
            let birthdayRole = await msg.guild.roles.create({
                data: {
                    name: Config.emotes.birthday,
                    color: `0xac1cfe`,
                    hoist: true,
                    mentionable: true,
                },
            });

            await this.guildRepo.updateBirthdayRole(msg.guild.id, birthdayRole?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully created the birthday role ${birthdayRole.toString()}!`
                )
                .setFooter('This role is actively removed from those whose birthday it isn\'t.')
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'trustedrole') {
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                let embed = new MessageEmbed()
                    .setTitle('Not Enough Permissions!')
                    .setDescription('The bot must have permission to manage roles!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            // Create role with desired attributes
            let trustedRole = await msg.guild.roles.create({
                data: {
                    name: 'BirthdayTrusted',
                },
            });

            await this.guildRepo.updateTrustedRole(msg.guild.id, trustedRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully created the trusted role ${trustedRole.toString()}!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'birthdaymaster' || args[2].toLowerCase() === 'birthdaymasterrole') {
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                let embed = new MessageEmbed()
                    .setTitle('Not Enough Permissions!')
                    .setDescription('The bot must have permission to manage roles!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            // Create role with desired attributes
            let birthdayMasterRole = await msg.guild.roles.create({
                data: {
                    name: 'BirthdayMaster',
                },
            });

            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, birthdayMasterRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully created the birthday master role ${birthdayMasterRole.toString()}!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        }
    }
}
