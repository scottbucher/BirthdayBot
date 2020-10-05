import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';
import { PermissionUtils } from '../utils';

let Config = require('../../config/config.json');

export class UpdateCommand implements Command {
    public name: string = 'update';
    public aliases = ['overwrite'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 2) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription(
                    'Please specify what to create!\nAccepted Values: `channel`, `role`, `trustedRole`, `birthdayMasterRole'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        } else if (args.length === 3) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Usage!')
                .setDescription('Please specify what to update it with!')
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

            // Find channel with desired attributes
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
                let embed = new MessageEmbed()
                    .setDescription('Invalid channel!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            // Bot needs to be able to message in the desired channel
            if (!PermissionUtils.canSend(birthdayChannel)) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `I don't have permission to send messages in ${birthdayChannel.toString()}!`
                    )
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            await this.guildRepo.updateBirthdayChannel(msg.guild.id, birthdayChannel?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set the birthday channel to ${birthdayChannel.toString()}!`
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

            // Find role with desired attributes
            let birthdayRole: Role = msg.mentions.roles.first();

            if (!birthdayRole) {
                birthdayRole = msg.guild.roles.cache.find(role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase())
                );
            }

            if (
                !birthdayRole ||
                birthdayRole.id === msg.guild.id ||
                args[3].toLowerCase() === 'everyone'
            ) {
                let embed = new MessageEmbed()
                    .setDescription(`Invalid Role!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            if (
                birthdayRole.position >
                msg.guild.members.resolve(msg.client.user).roles.highest.position
            ) {
                let embed = new MessageEmbed()
                    .setDescription(`Birthday Role must be bellow the Bot's role!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            if (birthdayRole.managed) {
                let embed = new MessageEmbed()
                    .setDescription(`Birthday Role cannot be managed by an external service!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            await this.guildRepo.updateBirthdayRole(msg.guild.id, birthdayRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully set the birthday role to ${birthdayRole.toString()}!`)
                .setFooter('This role is actively removed from those whose birthday it isn\'t.')
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'trustedrole') {
            // Set role with desired attributes
            let trustedRole: Role = msg.mentions.roles.first();

            if (!trustedRole) {
                trustedRole = msg.guild.roles.cache.find(role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase())
                );
            }

            if (
                !trustedRole ||
                trustedRole.id === msg.guild.id ||
                args[3].toLowerCase() === 'everyone'
            ) {
                let embed = new MessageEmbed()
                    .setDescription(`Invalid Role!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            if (trustedRole.managed) {
                let embed = new MessageEmbed()
                    .setDescription(`Trusted Role cannot be managed by an external service!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            await this.guildRepo.updateTrustedRole(msg.guild.id, trustedRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully set the trusted role to ${trustedRole.toString()}!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (args[2].toLowerCase() === 'birthdaymaster' || args[2].toLowerCase() === 'birthdaymasterrole') {
            // Set role with desired attributes
            let birthdayMasterRole: Role = msg.mentions.roles.first();

            if (!birthdayMasterRole) {
                birthdayMasterRole = msg.guild.roles.cache.find(role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase())
                );
            }

            if (
                !birthdayMasterRole ||
                birthdayMasterRole.id === msg.guild.id ||
                args[3].toLowerCase() === 'everyone'
            ) {
                let embed = new MessageEmbed()
                    .setDescription(`Invalid Role!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            if (birthdayMasterRole.managed) {
                let embed = new MessageEmbed()
                    .setDescription(`Birthday Master Role cannot be managed by an external service!`)
                    .setColor(Config.colors.error);
                channel.send(embed);
                return;
            }

            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, birthdayMasterRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully set the birthday master role to ${birthdayMasterRole.toString()}!`)
                .setColor(Config.colors.success);
            await channel.send(embed);
        }
    }
}
