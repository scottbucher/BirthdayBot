import { BdayUtils, MathUtils } from '../utils';
import { BirthdayService, Logger } from '../services';
import { Client, Guild, GuildManager, GuildMember, User } from 'discord.js';
import { GuildRepo, UserRepo } from '../services/database/repos';

import { Job } from './job';
import { UserData } from '../models/database/user-models';
import { clear } from 'console';
import moment from 'moment';

let Logs = require('../../lang/logs.json');

export class BirthdayJob implements Job {
    constructor(
        private client: Client,
        private guildRepo: GuildRepo,
        private userRepo: UserRepo,
        private birthdayService: BirthdayService
    ) {}

    public async run(): Promise<void> {
        Logger.info(Logs.info.birthdayJobStarted);

        let now = moment();
        let today = now.format('MM-DD');
        let tomorrow = now.add(1, 'day').format('MM-DD');
        let yesterday = now.subtract(1, 'day').format('MM-DD');

        let userDatas: UserData[] = [];

        // Get a user data list of all POSSIBLE birthday events, this includes birthday role, message AND role take.
        // Do to timezones and custom message time this can range by a day, thus we get 3 days worth of birthdays for each check
        userDatas.concat(await this.userRepo.getUsersWithBirthday(today));
        userDatas.concat(await this.userRepo.getUsersWithBirthday(tomorrow));
        userDatas.concat(await this.userRepo.getUsersWithBirthday(yesterday));

        if (!MathUtils.isLeap(now.year()) && today === '02-28') {
            // Add leap year birthdays to list
            userDatas.concat(await this.userRepo.getUsersWithBirthday('02-29'));
        }

        // Get list of guilds the client is connected to
        let discordIds = this.client.guilds.cache.map(guild => guild.id);

        // Get guild data from the database
        let guildDatas = await this.guildRepo.getGuilds(discordIds);
        Logger.info(
            Logs.info.birthdayJobGuildCount.replace(
                '{GUILD_COUNT}',
                guildDatas.length.toLocaleString()
            )
        );

        let promises = [];

        for (let guildData of guildDatas) {
            // Resolve Guild
            let guild: Guild;
            try {
                guild = this.client.guilds.resolve(guildData.GuildDiscordId);
            } catch (error) {
                Logger.error(
                    Logs.error.resolveGuild.replace('{GUILD_ID}', guildData.GuildDiscordId),
                    error
                );
                continue;
            }

            if (!guild) continue;

            let members = await guild.members.fetch();

            // Remove members who are not apart of this guild
            for (let member of members.keyArray()) {
                userDatas.filter(user => user.UserDiscordId !== member);
            }

            // Remove people whose birthday isn't today (isBirthday() considers timezones)
            userDatas.filter(userData => !BdayUtils.isBirthday(userData));

            promises.push(
                this.birthdayService
                    .celebrateBirthdays(guild, guildData, userDatas, members)
                    .catch(error => {
                        // send userRoleList and messageList
                        Logger.error(
                            Logs.error.celebrateBirthday
                                .replace('{GUILD_NAME}', guild.name)
                                .replace('{GUILD_ID}', guild.id),
                            error
                        );
                    })
            );
        }

        // Wait for all birthday celebrations to finish
        await Promise.allSettled(promises);
        Logger.info(Logs.info.completedBirthdayJob);
    }
}
