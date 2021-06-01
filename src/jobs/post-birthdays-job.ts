import { BdayUtils, TimeUtils } from '../utils';
import { BirthdayService, Logger } from '../services';
import { BlacklistRepo, GuildRepo, UserRepo } from '../services/database/repos';
import { Client, Collection, Guild, GuildMember } from 'discord.js';

import { Job } from './job';
import { UserData } from '../models/database';
import moment from 'moment';
import schedule from 'node-schedule';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class PostBirthdaysJob implements Job {
    public name = 'Post Birthday';
    public schedule: string = Config.jobs.postBirthdays.schedule;
    public log: boolean = Config.jobs.postBirthdays.log;
    public interval: number = Config.jobs.postBirthdays.interval;

    constructor(
        private client: Client,
        private guildRepo: GuildRepo,
        private userRepo: UserRepo,
        private blacklistRepo: BlacklistRepo,
        private birthdayService: BirthdayService
    ) {}

    public async run(): Promise<void> {
        let now = moment();
        let today = now.clone().format('MM-DD');
        let tomorrow = now.clone().add(1, 'day').format('MM-DD');
        let yesterday = now.clone().subtract(1, 'day').format('MM-DD');

        // Get a user data list of all POSSIBLE birthday events, this includes birthday role, message AND role take.
        // Do to timezones and custom message time this can range by a day, thus we get 3 days worth of birthdays for each check
        let userDatas: UserData[] = [
            ...(await this.userRepo.getUsersWithBirthday(today)),
            ...(await this.userRepo.getUsersWithBirthday(tomorrow)),
            ...(await this.userRepo.getUsersWithBirthday(yesterday)),
        ];

        if (!TimeUtils.isLeap(now.year()) && [today, tomorrow, yesterday].includes('02-28')) {
            // Add leap year birthdays to list
            userDatas.push(...(await this.userRepo.getUsersWithBirthday('02-29')));
        }

        // Remove people whose birthday isn't today (isBirthday() considers timezones)
        // TODO: Pass in guildData instead of "undefined"
        userDatas = userDatas.filter(userData => BdayUtils.isBirthday(userData, undefined));

        // Get list of guilds the client is connected to
        let guildIds = this.client.guilds.cache.map(guild => guild.id);

        // Get guild data from the database
        let guildDatas = await this.guildRepo.getGuilds(guildIds);
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
                let memberIds = members.map(member => member.id);

                // Get the blacklisted members for this guild
                let blacklistedMemberIds = (
                    await this.blacklistRepo.getBlacklist(guild.id)
                ).blacklist.map(data => data.UserDiscordId);

                // Find members who aren't blacklisted
                let unblacklistedMemberIds = memberIds.filter(
                    memberId => !blacklistedMemberIds.includes(memberId)
                );

                // Filter the user datas to guild members who aren't blacklisted
                let unblacklistedUserDatas = userDatas.filter(userData =>
                    unblacklistedMemberIds.includes(userData.UserDiscordId)
                );

                promises.push(
                    this.birthdayService
                        .celebrateBirthdays(guild, guildData, unblacklistedUserDatas, members)
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

            await TimeUtils.sleep(this.interval);
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
