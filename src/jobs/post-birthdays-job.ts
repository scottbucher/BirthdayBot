import { BdayUtils, MathUtils, TimeUtils } from '../utils';
import { BirthdayService, Logger } from '../services';
import { Client, Collection, Guild, GuildMember } from 'discord.js';
import { GuildRepo, UserRepo } from '../services/database/repos';

import { Job } from './job';
import { UserData } from '../models/database';
import moment from 'moment';
import schedule from 'node-schedule';

let Logs = require('../../lang/logs.json');

export class PostBirthdaysJob implements Job {
    constructor(
        public schedule: string,
        private client: Client,
        private guildRepo: GuildRepo,
        private userRepo: UserRepo,
        private birthdayService: BirthdayService
    ) {}

    public async run(): Promise<void> {
        let now = moment();
        let today = moment().format('MM-DD');
        let tomorrow = moment().add(1, 'day').format('MM-DD');
        let yesterday = moment().subtract(1, 'day').format('MM-DD');

        // Get a user data list of all POSSIBLE birthday events, this includes birthday role, message AND role take.
        // Do to timezones and custom message time this can range by a day, thus we get 3 days worth of birthdays for each check
        let userDatas: UserData[] = [
            ...(await this.userRepo.getUsersWithBirthday(today)),
            ...(await this.userRepo.getUsersWithBirthday(tomorrow)),
            ...(await this.userRepo.getUsersWithBirthday(yesterday)),
        ];

        if (!MathUtils.isLeap(now.year()) && today === '02-28') {
            // Add leap year birthdays to list
            userDatas.push(...(await this.userRepo.getUsersWithBirthday('02-29')));
        }

        // Remove people whose birthday isn't today (isBirthday() considers timezones)
        userDatas = userDatas.filter(userData => BdayUtils.isBirthday(userData));

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
                if (!guild) continue;
            } catch (error) {
                Logger.error(
                    Logs.error.resolveGuild
                        .replace('{GUILD_ID}', guildData.GuildDiscordId)
                        .replace('{GUILD_NAME}', guild.name),
                    error
                );
                continue;
            }

            try {
                let members: Collection<string, GuildMember> = guild.members.cache;
                let beforeCacheSize = guild.members.cache.size;

                if (Math.abs(guild.memberCount - beforeCacheSize) > 1) {
                    try {
                        members = await guild.members.fetch();
                    } catch (error) {
                        members = guild.members.cache;
                        Logger.error(
                            Logs.error.birthdayService
                                .replace('{GUILD_ID}', guildData.GuildDiscordId)
                                .replace('{GUILD_NAME}', guild.name)
                                .replace('{MEMBER_COUNT}', guild.memberCount.toLocaleString())
                                .replace(
                                    '{MEMBER_CACHE_BEFORE_COUNT}',
                                    beforeCacheSize.toLocaleString()
                                )
                                .replace(
                                    '{MEMBER_CACHE_AFTER_COUNT}',
                                    guild.members.cache.size.toLocaleString()
                                ),
                            error
                        );
                    }
                }

                // Get a list of memberIds
                let memberIds = members.map(member => member.id.toString());

                // Remove members who are not apart of this guild
                let memberUserDatas = userDatas.filter(userData =>
                    memberIds.includes(userData.UserDiscordId)
                );

                promises.push(
                    this.birthdayService
                        .celebrateBirthdays(guild, guildData, memberUserDatas, members)
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
            } catch (error) {
                Logger.error(
                    Logs.error.birthdayService
                        .replace('{GUILD_ID}', guildData.GuildDiscordId)
                        .replace('{GUILD_NAME}', guild.name)
                        .replace('{MEMBER_COUNT}', guild.memberCount.toLocaleString())
                        .replace('{MEMBER_CACHE_COUNT}', guild.members.cache.size.toLocaleString()),
                    error
                );
                continue;
            }
            await TimeUtils.sleep(100);
        }

        // Wait for all birthday celebrations to finish
        await Promise.allSettled(promises);
    }

    public start(): void {
        schedule.scheduleJob(this.schedule, async () => {
            try {
                Logger.info(Logs.info.birthdayJobStarted);
                await this.run();
                Logger.info(Logs.info.completedBirthdayJob);
            } catch (error) {
                Logger.error(Logs.error.birthdayJob, error);
            }
        });
    }
}
