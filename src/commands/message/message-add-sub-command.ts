import { ActionUtils, GuildUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';

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
                    .setTitle('Birthday Message Add - Expired')
                    .setDescription('Type `bday message add <Message>` to add a custom birthday message.')
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

        if (birthdayMessage.length > Config.maxMessageSize) {
            let embed = new MessageEmbed()
                .setDescription(`Custom Messages are maxed at ${Config.maxMessageSize.toLocaleString()} characters!`)
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
            if (customMessages.customMessages.length >= Config.maxMessages.free && !hasPremium) {
                let embed = new MessageEmbed()
                    .setDescription(`Your server has reached the maximum custom messages! (${Config.maxMessages.free.toLocaleString()})`)
                    .setFooter(
                        `To have up to ${Config.maxMessages.paid.toLocaleString()} custom birthday messages get Birthday Bot Premium!`,
                        msg.client.user.avatarURL()
                    )
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            } else if (customMessages.customMessages.length >= Config.maxMessages.paid) {
                let embed = new MessageEmbed()
                    .setDescription(`Your server has reached the maximum custom messages! (${Config.maxMessages.paid.toLocaleString()})`)
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
                        .setTitle('Caution')
                        .setDescription(
                            `There is already a custom message set for this user, would you like to overwrite it?` +
                                `\n\n**Current Message**: ${userMessage[0].Message}` +
                                `\n\n**New Message**: ${birthdayMessage}`
                        )
                        .setFooter('This action is irreversible!', msg.client.user.avatarURL())
                        .setColor(Config.colors.warning);

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
