import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { MessageUtils } from '../utils';

let Config = require('../../config/config.json'); // Possible support for server specific prefixes?

export class DefaultHelpCommand implements Command {
    public name: string = 'help';
    public aliases = ['?'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let prefix = Config.prefix;
        let embed = new MessageEmbed();

        if (args.length <= 2) {
            embed
                .setAuthor('Birthday Bot General Help', msg.client.user.avatarURL())
                .setDescription(
                    `Birthday Bot celebrates user's birthdays and allows for a wide variety of settings and customizability for server owners. ` +
                        '\n' +
                        `\n**${prefix} set** - Set your birthday.` +
                        `\n**${prefix} view [user]** - View your birthday or a users birthday.` +
                        `\n**${prefix} next**\*\* - View next birthday(s) in the server.` +
                        `\n**${prefix} list [page]**\*\* - View the server birthday list.` +
                        `\n**${prefix} map** - View the time zone map.` +
                        `\n**${prefix} invite** - Invite Birthday Bot to a server.` +
                        `\n**${prefix} support** - Join the support server.` +
                        `\n**${prefix} purge** - Remove your birthday data.` +
                        `\n**${prefix} help setup** - Help for server setup.` +
                        `\n**${prefix} help message** - Help for the birthday message settings.` +
                        `\n**${prefix} help trusted** - Help for the trusted system.` +
                        `\n**${prefix} settings**\*\* - View server's settings.` +
                        `\n**${prefix} test [User]**\*\* - Test the birthday event.` +
                        `\n` +
                        '\nIf you have any question/problems please join our support server [here](https://discord.gg/9gUQFtz).'
                )
                .addField('Legend', '\*\* = Server Only Command')
                .setColor(Config.colors.default);
        } else if (args[2].toLowerCase() === 'setup') {
            embed
                .setAuthor('Birthday Bot Setup Help - Guild Only', msg.client.user.avatarURL())
                .setDescription(
                    '' +
                        '\n' +
                        `\n**${prefix} setup** - Interactive guide for server setup.` +
                        '\n' +
                        `\n**${prefix} create <channel/role>** - Create the default birthday role/channel.` +
                        `\n**${prefix} update <channel/role> <#channel/@role>** - Update the birthday role/channel.` +
                        `\n**${prefix} clear <channel/role>** - Clear the birthday role/channel.`
                )
                .setColor(Config.colors.default);
        } else if (args[2].toLowerCase() === 'message') {
            embed
                .setAuthor('Birthday Bot Message Help - Guild Only', msg.client.user.avatarURL())
                .setDescription(
                    '' +
                        '\n' +
                        `\n**${prefix} setup message** - Interactive guide for message settings setup.` +
                        '\n' +
                        `\n**${prefix} message list [page]** - List all custom birthday messages.` +
                        `\n**${prefix} message add <message>** - Add a custom birthday message.\n - Placeholder for users: \`<Users>\`` +
                        `\n**${prefix} message remove <position>** - Remove a certain birthday message.` +
                        `\n**${prefix} message clear** - Clear all custom birthday messages.` +
                        `\n**${prefix} message time <0-23>** - Set the birthday message time.` +
                        `\n**${prefix} message mention <role/group>** - Set the birthday message mention setting.` +
                        `\n**${prefix} message embed <T/F>** - Should the birthday message be embedded.` +
                        `\n**${prefix} message test <position> [user count]** - Test a birthday message.`
                )
                .setColor(Config.colors.default);
        } else if (args[2].toLowerCase() === 'trusted') {
            embed
                .setAuthor('Birthday Bot Trusted System Help - Guild Only', msg.client.user.avatarURL())
                .setDescription(
                    '' +
                        '\n' +
                        `\n**${prefix} setup trusted** - Interactive guide for trusted system settings setup.` +
                        '\n' +
                        `\n**${prefix} create trustedRole** - Create the default trusted role.` +
                        `\n**${prefix} update trustedRole <channel>** - Update the trusted role.` +
                        `\n**${prefix} clear trustedRole ** - Clear the trusted role.` +
                        `\n**${prefix} trusted preventMsg <T/F>** - If trusted role is required for a birthday message.` +
                        `\n**${prefix} trusted preventRole <T/F>** - If trusted role is required to get the birthday role.`
                )
                .setColor(Config.colors.default);
        } else {
            embed
                .setAuthor('Birthday Bot General Help', msg.client.user.avatarURL())
                .setDescription(
                    `Birthday Bot celebrates user's birthdays and allows for a wide variety of settings and customizability for server owners. ` +
                        '\n' +
                        `\n**${prefix} set** - Set your birthday.` +
                        `\n**${prefix} view [user]** - View your birthday or a users birthday.` +
                        `\n**${prefix} next**\*\* - View next birthday(s) in the server.` +
                        `\n***${prefix} list [page]**\*\* - View the server birthday list.` +
                        `\n**${prefix} map** - View the time zone map.` +
                        `\n**${prefix} invite** - Invite Birthday Bot to a server.` +
                        `\n**${prefix} support** - Join the support server.` +
                        `\n**${prefix} purge** - Remove your birthday data.` +
                        `\n**${prefix} help setup** - Help for server setup.` +
                        `\n**${prefix} help message** - Help for the birthday message settings.` +
                        `\n**${prefix} help trusted** - Help for the trusted system.` +
                        `\n**${prefix} settings**\*\* - View server's settings.` +
                        `\n**${prefix} test [User]**\*\* - Test the birthday event.` +
                        `\n` +
                        '\nIf you have any question/problems please join our support server [here](https://discord.gg/9gUQFtz).'
                )
                .addField('Legend', '\*\* = Server Only Command')
                .setColor(Config.colors.default);
        }

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
