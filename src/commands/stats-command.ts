import { MessageUtils, ShardUtils } from '../utils';
import djs, { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

let Config = require('../../config/config.json');

export class StatsCommand implements Command {
    public name: string = 'stats';
    public aliases = ['statistics', 'data'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let today = moment().format('MM-DD');
        let month = moment().format('MM');
        let totalBirthdays = await this.userRepo.getUserCount();
        let birthdaysToday = await this.userRepo.getUserBirthdaysTodayCount(today);
        let birthdaysThisMonth = await this.userRepo.getUserBirthdaysThisMonthCount(month);

        let serverCount: number;
        let userCount: number;

        try {
            serverCount = await ShardUtils.retrieveServerCount(msg.client.shard);
            userCount = await ShardUtils.retrieveUserCount(msg.client.shard);
        } catch (error) {
            // Ignore case where stats command is run while shards are still being spawned
            if (error.name.includes('SHARDING_IN_PROCESS')) {
                return;
            } else {
                throw error;
            }
        }

        let shardId = msg.guild?.shardID || 0;

        let embed = new MessageEmbed()
            .setColor(Config.colors.default)
            .setThumbnail(msg.client.user.displayAvatarURL({ dynamic: true }))
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ dynamic: true }))
            .addField('Total Users', userCount.toLocaleString(), true)
            .addField('Total Birthdays', totalBirthdays.toLocaleString(), true)
            .addField('Total Servers', serverCount.toLocaleString(), true)
            .addField('Shard ID', `${shardId + 1}/${msg.client.shard.count}`, true)
            .addField('Birthdays Today', birthdaysToday.toLocaleString(), true)
            .addField('Birthdays This Month', birthdaysThisMonth.toLocaleString(), true)
            .addField('Node.js', process.version, true)
            .addField('discord.js', `v${djs.version}`, true);

        if (channel instanceof TextChannel) await channel.send(embed);
        else MessageUtils.sendDm(channel, embed);
    }
}
