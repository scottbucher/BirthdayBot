import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json'); // Possible support for server specific prefixes?

export class HelpCommand implements Command {
    public name: string = 'help';
    public aliases = ['?'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let embed = new MessageEmbed();
        let clientAvatarUrl = msg.client.user.avatarURL();

        let option = args[2]?.toLowerCase();
        if (!option) {
            embed
                .setAuthor(HELP_GENERAL_TITLE, clientAvatarUrl)
                .setDescription(HELP_GENERAL_DESC)
                .addField('Legend', HELP_GENERAL_LEGEND)
                .setColor(Config.colors.default);
        } else if (option === 'setup') {
            embed
                .setAuthor(HELP_SETUP_TITLE, clientAvatarUrl)
                .setDescription(HELP_SETUP_DESC)
                .setColor(Config.colors.default);
        } else if (option === 'message') {
            embed
                .setAuthor(HELP_MESSAGE_TITLE, clientAvatarUrl)
                .setDescription(HELP_MESSAGE_DESC)
                .setColor(Config.colors.default);
        } else if (option === 'trusted') {
            embed
                .setAuthor(HELP_TRUSTED_TITLE, clientAvatarUrl)
                .setDescription(HELP_TRUSTED_DESC)
                .setColor(Config.colors.default);
        } else {
            embed
                .setAuthor(HELP_GENERAL_TITLE, clientAvatarUrl)
                .setDescription(HELP_GENERAL_DESC)
                .addField('Legend', HELP_GENERAL_LEGEND)
                .setColor(Config.colors.default);
        }

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}

const HELP_GENERAL_TITLE = 'Birthday Bot General Help';
const HELP_GENERAL_DESC =
    `Birthday Bot helps your server celebrate birthdays with automatic birthday roles and announcements.` +
    '\n' +
    `\n**bday set** - Set your birthday.` +
    `\n**bday view [user]** - View your birthday or a users birthday.` +
    `\n**bday next**\*\* - View next birthday(s) in the server.` +
    `\n**bday list [page/date]**\*\* - View the server birthday list.` +
    `\n**bday map** - View the time zone map.` +
    `\n**bday invite** - Invite Birthday Bot to a server.` +
    `\n**bday support** - Join the support server.` +
    `\n**bday docs** - View the documentation.` +
    `\n**bday faq** - View the frequently asked questions.` +
    `\n**bday purge** - Remove your birthday data.` +
    `\n**bday help setup** - Help for server setup.` +
    `\n**bday help message** - Help for the birthday message settings.` +
    `\n**bday help trusted** - Help for the trusted system.` +
    `\n**bday settings**\*\* - View server's settings.` +
    `\n**bday test [user]**\*\* - Test the birthday event.` +
    `\n` +
    `\n**bday donate** - Support developments by donating!` +
    `\n` +
    `\nIf you have any question/problems please join our support server [here](${Config.links.support}).`;
const HELP_GENERAL_LEGEND = '** = Server Only Command';

const HELP_SETUP_TITLE = 'Birthday Bot Setup Help - Guild Only';
const HELP_SETUP_DESC =
    `\n**bday setup** - Interactive guide for server setup.` +
    '\n' +
    `\n**bday create <channel/role>** - Create the default birthday role/channel.` +
    `\n**bday update <channel/role> <#channel/@role>** - Update the birthday role/channel.` +
    `\n**bday clear <channel/role>** - Clear the birthday role/channel.`;

const HELP_MESSAGE_TITLE = 'Birthday Bot Message Help - Guild Only';
const HELP_MESSAGE_DESC =
    `\n**bday setup message** - Interactive guide for message settings setup.` +
    '\n' +
    `\n**bday message list [page]** - List all custom birthday messages.` +
    `\n**bday message add <message>** - Add a custom birthday message.\n - Placeholder for users: \`<Users>\`` +
    `\n**bday message remove <position>** - Remove a certain birthday message.` +
    `\n**bday message clear** - Clear all custom birthday messages.` +
    `\n**bday message time <0-23>** - Set the birthday message time.` +
    `\n**bday message mention <role/group>** - Set the birthday message mention setting.` +
    `\n**bday message embed <T/F>** - Should the birthday message be embedded.` +
    `\n**bday message test <position> [user count]** - Test a birthday message.`;

const HELP_TRUSTED_TITLE = 'Birthday Bot Trusted System Help - Guild Only';
const HELP_TRUSTED_DESC =
    `\n**bday setup trusted** - Interactive guide for trusted system settings setup.` +
    '\n' +
    `\n**bday create trustedRole** - Create the default trusted role.` +
    `\n**bday update trustedRole <channel>** - Update the trusted role.` +
    `\n**bday clear trustedRole ** - Clear the trusted role.` +
    `\n**bday trusted preventMsg <T/F>** - If trusted role is required for a birthday message.` +
    `\n**bday trusted preventRole <T/F>** - If trusted role is required to get the birthday role.`;
