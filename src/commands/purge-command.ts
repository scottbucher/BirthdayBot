import { ActionUtils } from '../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { DMChannel, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class PurgeCommand implements Command {
    public name: string = 'purge';
    public aliases = ['cleardata'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private userRepo: UserRepo) {}

    async execute(args: string[], msg: Message, channel: TextChannel | DMChannel): Promise<void> {
        let target = msg.author;
        let userData = await this.userRepo.getUser(target.id); // Try and get their data
        let confirmEmbed = new MessageEmbed();
        let changesLeft = 0;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            nextMsg.content.split(/\s+/)[0].toLowerCase() === Config.prefix;
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Birthday Purge - Expired')
                    .setDescription('Type `bday purge` to rerun the purge.')
                    .setColor(Config.colors.error)
            );
        };

        if (!userData || !(userData.Birthday && userData.TimeZone)) {
            // Are they in the database?
            let embed = new MessageEmbed()
                .setDescription('You do not have data in the database.')
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        } else {
            changesLeft = userData.ChangesLeft;
            confirmEmbed
                .setTitle('Clear User Data')
                .addField(
                    'Actions',
                    `${Config.emotes.confirm} Confirm\n${Config.emotes.deny} Cancel`
                )
                .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp()
                .setAuthor(target.tag, target.avatarURL());

            let description =
                'This command will remove both your time zone and your birthday from the database. [(?)](${Config.links.docs}/faq#why-does-birthday-bot-need-my-timezone)' +
                `\n\nThis will not reset your birthday attempts. (You have ${changesLeft} left) [(?)](${Config.links.docs}/faq#how-many-times-can-i-set-my-birthday)`;

            if (changesLeft === 0) {
                // Out of changes?
                description +=
                    '\n\n**NOTE**: You do not have any birthday attempts left! Clearing your birthday will mean you can no longer set it!';
            }
            confirmEmbed.setDescription(description);
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await channel.send(confirmEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await confirmationMessage.react(option);
        }

        let confirmation: string = await CollectorUtils.collectByReaction(
            confirmationMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === target.id && trueFalseOptions.includes(msgReaction.emoji.name),
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

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, null, null, changesLeft); // Add or update user

            let embed = new MessageEmbed()
                .setDescription('Successfully purged your data from the database.')
                .setColor(Config.colors.success);
            await channel.send(embed);
        } else if (confirmation === Config.emotes.deny) {
            // Cancel
            let embed = new MessageEmbed()
                .setDescription('Request Canceled.')
                .setColor(Config.colors.error);
            await channel.send(embed);
        }
    }
}
