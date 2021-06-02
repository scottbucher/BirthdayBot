import { CelebrationUtils, FormatUtils, MessageUtils } from '../utils';
import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

let Config = require('../../config/config.json');

export class NextCommand implements Command {
    public name: string = 'next';
    public aliases = ['upcoming'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = true;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

        let userDatas = await this.userRepo.getAllUsers(users);

        if (!userDatas) {
            let embed = new MessageEmbed()
                .setDescription('No one has set their birthday in this server! :(')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let commandUser = userDatas.find(user => user.UserDiscordId === msg.author.id);

        let nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, commandUser?.TimeZone);

        if (!nextBirthdayUsers) {
            let embed = new MessageEmbed()
                .setDescription('There are no upcoming birthdays!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let userList = nextBirthdayUsers.map(user => msg.guild.members.resolve(user.UserDiscordId));

        let userStringList = FormatUtils.joinWithAnd(userList.map(user => user.toString()));
        let nextBirthday = moment(nextBirthdayUsers[0].Birthday).format('MMMM Do');

        let embed = new MessageEmbed()
            .setDescription(`${userStringList}'s birthday is next on **${nextBirthday}**!`)
            .setColor(Config.colors.default);
        await MessageUtils.send(channel, embed);
    }
}
