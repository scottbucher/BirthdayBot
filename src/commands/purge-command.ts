import { ActionUtils, PermissionUtils } from '../utils';
import { DMChannel, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

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
                .setAuthor(`${target.username}#${target.discriminator}`, target.avatarURL());

            let description =
                'This command will remove both your time zone and your birthday from the database. [(?)]()' +
                `\n\nThis will not reset your birthday attempts. (You have ${changesLeft} left) [(?)]()`;

            if (changesLeft === 0) {
                // Out of changes?
                description +=
                    '\n\n**NOTE**: You do not have any birthday attempts left! Clearing your birthday will mean you can no longer set it!';
            }
            confirmEmbed.setDescription(description);
        }

        let confirmationMsg = await channel.send(confirmEmbed);
        await confirmationMsg.react(Config.emotes.confirm);
        await confirmationMsg.react(Config.emotes.deny);

        const filter = (nextReaction: MessageReaction, reactor: User) =>
            (nextReaction.emoji.name === Config.emotes.confirm ||
                nextReaction.emoji.name === Config.emotes.deny) &&
            nextReaction.users.resolve(msg.client.user.id) !== null &&
            reactor === target; // Reaction Collector Filter

        let reactionCollector = confirmationMsg.createReactionCollector(filter, {
            time: Config.promptExpireTime * 1000,
        });

        let expired = true;

        reactionCollector.on('collect', async (nextReaction: MessageReaction) => {
            // Start Reaction Collector
            // Check if bot has permission to send a message
            if (!PermissionUtils.canSend(channel)) {
                reactionCollector.stop();
                expired = false;
                return;
            }

            await ActionUtils.deleteMessage(confirmationMsg); // Try and delete the message

            expired = false;
            reactionCollector.stop();

            if (nextReaction.emoji.name === Config.emotes.confirm) {
                // Confirm
                await this.userRepo.addOrUpdateUser(target.id, null, null, changesLeft); // Add or update user

                let embed = new MessageEmbed()
                    .setDescription('Successfully purged your data from the database.')
                    .setColor(Config.colors.success);
                await channel.send(embed);
            } else if (nextReaction.emoji.name === Config.emotes.deny) {
                // Cancel
                let embed = new MessageEmbed()
                    .setDescription('Request Canceled.')
                    .setColor(Config.colors.error);
                await channel.send(embed);
            }
        });

        reactionCollector.on('end', async () => {
            // Check if I have permission to send a message
            if (!PermissionUtils.canSend(channel)) {
                expired = false;
                reactionCollector.stop();
                return;
            }

            if (expired) {
                let embed = new MessageEmbed()
                    .setTitle('User Data Purge - Expired')
                    .setDescription('Type `bday purge` to rerun the process.')
                    .setColor(Config.colors.error);
                await channel.send(embed);
            }
        });
    }
}
