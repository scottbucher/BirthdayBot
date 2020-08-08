import { DMChannel, Message, MessageEmbed, ShardingManager, TextChannel } from 'discord.js';
import { MessageUtils, ShardUtils } from '../utils';

import moment from 'moment';
import { UserRepo } from '../services/database/repos';
import { Command } from './command';

let Config = require('../../config/config.json');
let version = require('discord.js').version;

export class StatsCommand implements Command {
    public name: string = 'stats';
    public aliases = ['statistics', 'data'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(/*private shardManager: ShardingManager,*/ private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let today = moment().format('MM-DD');
        let month = moment().format('MM');
        let totalBirthdays = await this.userRepo.getUserCount();
        let birthdaysToday = await this.userRepo.getUserBirthdaysTodayCount(today);
        let birthdaysThisMonth = await this.userRepo.getUserBirthdaysThisMonthCount(month);
        let serverCount = await ShardUtils.retrieveServerCount(msg.client.shard);
        let userCout = await ShardUtils.retrieveUserCount(msg.client.shard);

        let embed = new MessageEmbed()
            .setColor(Config.colors.default)
            .setThumbnail(msg.client.user.displayAvatarURL({ dynamic: true }))
            .setAuthor(
                `${msg.author.username}#${msg.author.discriminator}`,
                msg.author.displayAvatarURL({ dynamic: true })
            )
            .addField('Total Users', userCout, true)
            .addField('Total Birthdays', totalBirthdays, true)
            .addField('Total Servers', serverCount, true)
            .addField('Shard ID', `${msg.guild.shardID + 1}/${msg.client.ws.shards.size}`, true)
            .addField('Birthdays Today', birthdaysToday, true)
            .addField('Birthdays This Month', birthdaysThisMonth, true)
            .addField('Discord.js Version', version, true);

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
