import { GuildUtils, MathUtils, MessageUtils, ParseUtils } from '../utils';
import { Message, MessageEmbed, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

export class SetAttemptsCommand implements Command {
    public name: string = 'setattempts';
    public aliases = ['setchangesleft'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = true;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let target: User;

        if (args.length < 3) {
            let embed = new MessageEmbed()
                .setDescription('Please specify a user!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
        // Get who they are mentioning
        target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[2])?.user;

        // Did we find a user?
        if (!target) {
            let embed = new MessageEmbed()
                .setDescription('Could not find that user!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription('Please specify an amount!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let amount = MathUtils.clamp(ParseUtils.parseInt(args[3]), 0, 127);

        if (!(typeof amount === 'number') || !amount) {
            let embed = new MessageEmbed()
                .setDescription('Invalid Number!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (amount > 127) {
            let embed = new MessageEmbed()
                .setDescription('Amount too large!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let userData = await this.userRepo.getUser(target.id);

        if (!userData) {
            let embed = new MessageEmbed().setColor(Config.colors.error);
            if (target !== msg.author) {
                embed.setDescription('That user has not used any attempts');
            }
            await MessageUtils.send(channel, embed);
            return;
        }

        await this.userRepo.addOrUpdateUser(
            target.id,
            userData.Birthday,
            userData.TimeZone,
            amount
        );

        let embed = new MessageEmbed()
            .setDescription(
                `Successfully set ${target.toString()}'s birthday attempts to ${amount}!`
            )
            .setColor(Config.colors.default);
        await MessageUtils.send(channel, embed);
        return;
    }
}
