import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { Command } from './command';
import { GuildRepo } from '../services/database/repos';

let Config = require('../../config/config.json');
let Color = require('color');

export class SettingsCommand implements Command {
    public name: string = 'settings';
    public aliases = ['setting'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private guildRepo: GuildRepo) {}

    async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let guild = msg.guild;
        let guildData = await this.guildRepo.getGuild(guild.id);

        let settingsEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}'s Settings`, guild.iconURL())
            .setFooter(`© ${new Date().getFullYear()} Birthday Bot`, msg.client.user.avatarURL())
            .setTimestamp();

        let birthdayChannel: string;
        let birthdayRole: string;
        let mentionSetting = 'None';
        let messageTime: string;
        let trustedRole: string;
        let birthdayMasterRole: string;
        let preventsRole = guildData.TrustedPreventsRole ? 'True' : 'False';
        let preventsMessage = guildData.TrustedPreventsMessage ? 'True' : 'False';
        let useEmbed = guildData.UseEmbed ? 'True' : 'False';

        // Get Message Time
        if (guildData.MessageTime === 0) messageTime = '12:00 AM';
        else if (guildData.MessageTime === 12) messageTime = '12:00 PM';
        else if (guildData.MessageTime < 12) messageTime = guildData.MessageTime + ':00 AM';
        else messageTime = guildData.MessageTime - 12 + ':00 PM';

        // Find mentioned role
        let roleInput: Role = guild.roles.resolve(guildData.MentionSetting);

        if (!roleInput || roleInput.guild.id !== msg.guild.id) {
            if (
                guildData.MentionSetting.toLowerCase() === 'everyone' ||
                guildData.MentionSetting.toLowerCase() === 'here'
            ) {
                mentionSetting = '@' + guildData.MentionSetting;
            }
        } else {
            mentionSetting = roleInput.toString();
        }

        birthdayChannel =
            guildData.BirthdayChannelDiscordId === '0'
                ? 'Not Set'
                : guild.channels.resolve(guildData.BirthdayChannelDiscordId)?.toString() ||
                  '**Deleted Channel**';
        birthdayRole =
            guildData.BirthdayRoleDiscordId === '0'
                ? 'Not Set'
                : guild.roles.resolve(guildData.BirthdayRoleDiscordId)?.toString() ||
                  '**Deleted Role**';
        trustedRole =
            guildData.TrustedRoleDiscordId === '0'
                ? 'Not Set'
                : guild.roles.resolve(guildData.TrustedRoleDiscordId)?.toString() ||
                  '**Deleted Role**';
        birthdayMasterRole =
            guildData.BirthdayMasterRoleDiscordId === '0'
                ? 'Not Set'
                : guild.roles.resolve(guildData.BirthdayMasterRoleDiscordId)?.toString() ||
                  '**Deleted Role**';

        let color: string;

        try {
            color = Color('#' + guildData.MessageEmbedColor).hex();
        } catch (error) {
            color = Config.colors.default;
        }

        settingsEmbed
            .setColor(color)
            .addField('Birthday Channel', birthdayChannel, true)
            .addField('Birthday Role', birthdayRole, true)
            .addField('Birthday Master Role', birthdayMasterRole, true)
            .addField('Mention Setting', mentionSetting, true)
            .addField('Message Time', messageTime, true)
            .addField('Trusted Role', trustedRole, true)
            .addField('Trusted Prevents Role', preventsRole, true)
            .addField('Trusted Prevents Message', preventsMessage, true)
            .addField('Embed Birthday Message', useEmbed, true)
            .addField('Birthday Message Color', color, true)
            .addField('Guild Id', guild.id, true);

        await channel.send(settingsEmbed);
    }
}
