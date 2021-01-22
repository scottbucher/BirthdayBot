import { DMChannel, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import { GuildUtils, MessageUtils } from '../utils';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

let Config = require('../../config/config.json');

export class ViewCommand implements Command {
    public name: string = 'view';
    public aliases = ['see'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let target: User;

        if (args.length === 3) {
            // Check if the user is trying to set another person's birthday
            if (channel instanceof DMChannel) {
                let embed = new MessageEmbed()
                    .setDescription(`You cannot request another user's information in a DM!`)
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            // Get who they are mentioning
            target =
                msg.mentions.members.first()?.user ||
                GuildUtils.findMember(msg.guild, args[2])?.user;

            // Did we find a user?
            if (!target) {
                let embed = new MessageEmbed()
                    .setDescription('Could not find that user!')
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }
        } else {
            // They didn't mention anyone
            target = msg.author;
        }

        let userData = await this.userRepo.getUser(target.id);

        if (!userData || !userData.Birthday || !userData.TimeZone) {
            let embed = new MessageEmbed().setColor(Config.colors.error);
            if (target !== msg.author) {
                embed.setDescription('That user has not set their birthday!');
            } else {
                embed.setDescription('You have not set your birthday!');
            }
            await MessageUtils.send(channel, embed);
            return;
        }

        let embed = new MessageEmbed();

        if (msg.author === target) {
            embed
                .setDescription(
                    `Your birthday is on **${moment(userData.Birthday).format('MMMM Do')}, ${
                        userData.TimeZone
                    }**!`
                )
                .setColor(Config.colors.default)
                .setFooter(
                    `You currently have ${userData.ChangesLeft} birthday attempt${
                        userData.ChangesLeft > 1 ? 's' : ''
                    } left.`
                );
        } else {
            embed
                .setDescription(
                    `${target.toString()}'s birthday is on **${moment(userData.Birthday).format(
                        'MMMM Do'
                    )}, ${userData.TimeZone}**!`
                )
                .setColor(Config.colors.default);
        }
        await MessageUtils.send(channel, embed);
        return;
    }
}
