import { ActionUtils, GuildUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import e from 'express';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class MessageAddSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Birthday Message Clear - Expired')
                    .setDescription('Type `bday blacklist clear` to clear the birthday blacklist.')
                    .setColor(Config.colors.error)
            );
        };

        // Variable that decides if we should overwrite an already set user message (default true as not all messages are user messages)
        let overwrite = true;

        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        // Try and find someone they are mentioning
        let target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[3])?.user;

        // Do they have premium?
        let hasPremium = false;

        // Did we find a user?
        if (target) {
            if (target.bot) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Usage!')
                    .setDescription('You cannot set a custom message for a bot!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            } else if (!hasPremium) {
                // you don't have premium!!!
            }
        }

        // Get Message
        let birthdayMessage: string;

        // Compile the birthday message
        if (target) {
            // If the input of the target WASN'T a @mention, replace it with the <@USER_ID> format so the substring works universally
            birthdayMessage = msg.content.replace(args[3], target.toString() + ' ')
                .substring(msg.content.indexOf('add') + 27)
                .replace(/@users?|<users?>|{users?}/gi, '<Users>');
        } else {
            // Basic non user specific custom message
            birthdayMessage = msg.content
                .substring(msg.content.indexOf('add') + 4)
                .replace(/@users?|<users?>|{users?}/gi, '<Users>');
        }

        if (birthdayMessage.length > 300) {
            let embed = new MessageEmbed()
                .setDescription('Custom Messages are maxed at 300 characters!')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        if (!birthdayMessage.includes('<Users>')) {
            let embed = new MessageEmbed()
                .setDescription(
                    '' +
                        'Please include the `<Users>` placeholder somewhere in the message. This indicates where birthday usernames will appear.' +
                        '\n' +
                        '\nEx: `bday message add Happy Birthday <Users>!`'
                )
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id);

        if (customMessages) {
            if (customMessages.customMessages.length >= 100 && !hasPremium) {
                ////////////////////////////////////////////////////////////////// CHANGE THIS BACK TO 10 AFTER TESTING
                let embed = new MessageEmbed()
                    .setDescription('Your server has reached the maximum custom messages! (10)')
                    .setFooter(
                        'To have up to 500 custom birthday messages get Birthday Bot Premium!',
                        msg.client.user.avatarURL()
                    )
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            } else if (customMessages.customMessages.length >= 500) {
                let embed = new MessageEmbed()
                    .setDescription('Your server has reached the maximum custom messages! (500)')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }

            // If there is a target, begin the checks if there is a user custom message already for the target
            if (target) {
                let userMessage = customMessages.customMessages.filter(
                    message => message.UserDiscordId === target.id
                );

                // if it found a message for this user
                if (userMessage.length > 0) {
                    // There is already a message for this user should they overwrite it?
                    let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

                    let confirmationEmbed = new MessageEmbed()
                        .setDescription(
                            `There is already a custom message set for this user, would you like to overwrite it?` +
                                `\nMessage: ${userMessage[0].Message}`
                        )
                        .setFooter('This action is irreversible!', msg.client.user.avatarURL())
                        .setColor(Config.colors.success);

                    let confirmationMessage = await channel.send(confirmationEmbed); // Send confirmation and emotes
                    for (let option of trueFalseOptions) {
                        await confirmationMessage.react(option);
                    }

                    let confirmation: string = await CollectorUtils.collectByReaction(
                        confirmationMessage,
                        // Collect Filter
                        (msgReaction: MessageReaction, reactor: User) =>
                            reactor.id === msg.author.id &&
                            trueFalseOptions.includes(msgReaction.emoji.name),
                        stopFilter,
                        // Retrieve Result
                        async (msgReaction: MessageReaction, reactor: User) => {
                            return msgReaction.emoji.name;
                        },
                        expireFunction,
                        COLLECT_OPTIONS
                    );

                    ActionUtils.deleteMessage(confirmationMessage);

                    if (confirmation === undefined) return;

                    // set the overwrite value
                    overwrite = confirmation === Config.emotes.confirm ? true : false;
                }
            } else {
                // Don't allow duplicate birthday messages for non user messages
                let duplicateMessage = customMessages.customMessages
                    .map(message => message.Message)
                    .includes(birthdayMessage);
                if (duplicateMessage) {
                    let embed = new MessageEmbed()
                        .setDescription('Duplicate message found for this server!')
                        .setColor(Config.colors.error);
                    await channel.send(embed);
                    return;
                }
            }
        }

        let userId = target ? target.id : '0';

        if (overwrite) {
            await this.customMessageRepo.addCustomMessage(msg.guild.id, birthdayMessage, userId);
        } else {
            let embed = new MessageEmbed()
                .setDescription('Action Canceled.')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let embed = new MessageEmbed()
            .setDescription(
                `Successfully added the birthday message:\n\n\`${birthdayMessage}\`\n\u200b`
            )
            .addField(
                'Actions',
                '' +
                    '`bday message list [page]` - List all custom birthday messages.' +
                    '\n`bday message test <position> [user count]` - Test a birthday message.'
            )
            .setColor(Config.colors.success);
        await channel.send(embed);
    }
}
