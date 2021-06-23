import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { MessageUtils, ShardUtils } from '../utils';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

let Config = require('../../config/config.json');

export class StatsCommand implements Command {
    public name: string = 'stats';
    public aliases = ['stat', 'statistics', 'info', 'information', 'data'];
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
        let today = moment().format('MM-DD');
        let month = moment().format('MM');
        let totalBirthdays = await this.userRepo.getUserCount();
        let birthdaysToday = await this.userRepo.getUserBirthdaysTodayCount(today);
        let birthdaysThisMonth = await this.userRepo.getUserBirthdaysThisMonthCount(month);

        let serverCount: number;

        try {
            serverCount = await ShardUtils.serverCount(msg.client.shard);
        } catch (error) {
            // Ignore case where stats command is run while shards are still being spawned
            if (error.name.includes('SHARDING_IN_PROCESS')) {
                return;
            } else {
                throw error;
            }
        }

        let shardId = msg.guild?.shardID || 0;

        await MessageUtils.send(
            channel,
            Lang.getEmbed('info.stats', LangCode.EN_US, {
                TOTAL_BIRTHDAYS: totalBirthdays.toLocaleString(),
                TOTAL_SERVERS: serverCount.toLocaleString(),
                SHARD_ID: `${shardId + 1}/${msg.client.shard.count}`,
                BIRTHDAYS_TODAY: birthdaysToday.toLocaleString(),
                BIRTHDAYS_THIS_MONTH: birthdaysThisMonth.toLocaleString(),
            })
                .setThumbnail(msg.client.user.displayAvatarURL({ dynamic: true }))
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ dynamic: true }))
        );
    }
}
