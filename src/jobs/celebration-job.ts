import { CelebrationUtils, TimeUtils } from '../utils';
import { Client, Collection, Guild, GuildMember } from 'discord.js';
import { CombinedRepo, UserRepo } from '../services/database/repos';
import { Logger, MessageService, RoleService, SubscriptionService } from '../services';

import { Job } from './job';
import { UserData } from '../models/database';
import moment from 'moment';
import schedule from 'node-schedule';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CelebrationJob implements Job {
    public name = 'Celebration';
    public schedule: string = Config.jobs.postCelebrationJob.schedule;
    public log: boolean = Config.jobs.postCelebrationJob.log;

    constructor(
        private client: Client,
        private userRepo: UserRepo,
        private combinedRepo: CombinedRepo,
        private messageService: MessageService,
        private roleService: RoleService,
        private subscriptionService: SubscriptionService
    ) {}

    public async run(): Promise<void> {
        let now = moment();
        let today = moment().format('MM-DD');
        let tomorrow = moment().add(1, 'day').format('MM-DD');
        let yesterday = moment().subtract(1, 'day').format('MM-DD');

        // Get a user data list of all POSSIBLE birthday events, this includes birthday role, message AND role take.
        // Do to timezones and custom message time this can range by a day, thus we get 3 days worth of birthdays for each check
        let birthdayUserData: UserData[] = [
            ...(await this.userRepo.getUsersWithBirthday(today)),
            ...(await this.userRepo.getUsersWithBirthday(tomorrow)),
            ...(await this.userRepo.getUsersWithBirthday(yesterday)),
        ];

        if (
            !TimeUtils.isLeap(now.year()) &&
            (today === '03-01' || tomorrow === '03-01' || yesterday === '03-01')
        ) {
            // Add leap year birthdays to list
            birthdayUserData.push(...(await this.userRepo.getUsersWithBirthday('02-29')));
        }
        // Collection of guilds
        let guildCache = this.client.guilds.cache;

        // String of guild ids who have an active subscription to birthday bot premium
        // TODO: Update APS to allow us the get all active subscribers so we can initialize this array
        let premiumGuildIds: string[] = Config.payments.enabled
            ? (await this.subscriptionService.getAllSubscription('premium-1'))
                  .filter(g => g.service)
                  .map(g => g.subscriber)
            : guildCache.map(g => g.id);

        // Get list of guilds the client is connected to
        let discordIds = guildCache.map(guild => guild.id);

        // Get the data from the database
        let guildCelebrationDatas = CelebrationUtils.convertCelebrationData(
            await this.combinedRepo.GetRawCelebrationData(discordIds)
        );

        // List of members with a birthday today
        let birthdayMessageGuildMembers: GuildMember[] = [];

        // This will be the array of GuildMembers who have an anniversary this hour
        let memberAnniversaryMessageGuildMembers: GuildMember[] = [];

        // This will be the array of guilds with server anniversaries today
        let guildsWithAnniversaryMessage: Guild[] = [];

        // Message service will take in a list of birthdayGuildMembers objects, a list of guild members with an anniversary today, and a list of guilds with an anniversary today
        // To get these we will:
        // --Birthday GuildMembers:
        // ----Get users with a birthday today, tomorrow, and yesterday from the database
        // ----Loop through the guilds, fetch each guild's members, and figure out if we are using the server or user timezone
        // ----Take the user list and filter for using the member list to get a guildMember list
        // ----Filter that guildMember list to those with birthdays today and who are not in the blacklist
        // --Member Anniversary GuildMembers:
        // ----Using the unfiltered guildMember List we simply filter it for those who have their member anniversary today, tomorrow, or yesterday
        // ----Then filter it again to check for those who are this hour (based on the timezone settings)
        // ------This is more tricky, you don't have to have your birthday set for this.
        // --Server Anniversary Guilds:
        // ----Simply check if this guild has a server anniversary today, tomorrow, or yesterday
        // ----Then check for the hour based on the timezone of the server

        // This will be the array of GuildMembers who are able to get the birthday role
        let addBirthdayRoleGuildMembers: GuildMember[] = [];

        // This will be the array of GuildMembers who are able to have the birthday role removed
        let removeBirthdayRoleGuildMembers: GuildMember[] = [];

        // This will be the array of GuildMembers who are able to get anniversary roles
        let anniversaryRoleGuildMembers: GuildMember[] = [];

        for (let guild of guildCache.array()) {
            let hasPremium = premiumGuildIds.includes(guild.id);
            let guildMembers: Collection<string, GuildMember> = guild.members.cache;
            let beforeCacheSize = guild.members.cache.size;

            if (Math.abs(guild.memberCount - beforeCacheSize) > 1) {
                try {
                    guildMembers = await guild.members.fetch();
                } catch (error) {
                    guildMembers = guild.members.cache;
                    // TODO: Update Logs
                    Logger.error(
                        Logs.error.celebrationJobForGuild
                            .replace('{GUILD_ID}', guild.id)
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

            // Get the guildData for this guild
            let guildData = guildCelebrationDatas.find(
                data => data.guildData.GuildDiscordId === guild.id
            )?.guildData;

            // Get the blacklist for this guild
            let blacklist = guildCelebrationDatas.find(
                data => data.guildData.GuildDiscordId === guild.id
            )?.blacklistedMembers;

            // We now have our list of guildMembers

            // Get a list of members with a birthday today (by using either the user or server timezone)
            let membersWithBirthdayToday = guildMembers
                .filter(
                    member =>
                        CelebrationUtils.isBirthdayToday(
                            birthdayUserData.find(data => data.UserDiscordId === member.id),
                            guildData
                        ) && !blacklist.map(data => data.UserDiscordId).includes(member.id)
                )
                .array();

            // Only put those who need the birthday message (based on the timezone and hour) into birthdayMessageGuildMembers
            birthdayMessageGuildMembers = birthdayMessageGuildMembers.concat(
                membersWithBirthdayToday.filter(member =>
                    CelebrationUtils.needsBirthdayMessage(
                        birthdayUserData.find(data => data.UserDiscordId === member.id),
                        guildData
                    )
                )
            );

            // We now have the full, filtered, list of birthdayMessageGuildMembers

            // Only put those who need the birthday role (based on the timezone and hour) into addBirthdayRoleGuildMembers
            addBirthdayRoleGuildMembers = addBirthdayRoleGuildMembers.concat(
                membersWithBirthdayToday.filter(member =>
                    CelebrationUtils.needsBirthdayRoleAdded(
                        birthdayUserData.find(data => data.UserDiscordId === member.id),
                        guildData
                    )
                )
            );

            // We now have the full, filtered, list of addBirthdayRoleGuildMembers

            // Only put those who need the birthday role removed (based on the timezone and hour) into removeBirthdayRoleGuildMembers
            removeBirthdayRoleGuildMembers = removeBirthdayRoleGuildMembers.concat(
                membersWithBirthdayToday.filter(member =>
                    CelebrationUtils.needsBirthdayRoleRemoved(
                        birthdayUserData.find(data => data.UserDiscordId === member.id),
                        guildData
                    )
                )
            );

            // We now have the full, filtered, list of removeBirthdayRoleGuildMembers

            // Next lets get the list of guild members who are eligible for the birthday role

            // Next lets find the list of members with anniversaries today
            let anniversaryMembers = guildMembers
                .filter(member => CelebrationUtils.isMemberAnniversaryMessage(member, guildData))
                .array();

            // Only add these members to the anniversaryRolesGuildMembers array if the server has premium
            if (hasPremium) {
                anniversaryRoleGuildMembers =
                    anniversaryRoleGuildMembers.concat(anniversaryMembers);
            }

            // All servers get member anniversary messages so add them regardless of if they have premium
            memberAnniversaryMessageGuildMembers =
                memberAnniversaryMessageGuildMembers.concat(anniversaryMembers);

            // We now have the full, filtered, list of memberAnniversaryMessageGuildMembers

            // Next lets find the list of guildsWithAnniversaryMessage
            if (CelebrationUtils.isServerAnniversaryMessage(guild, guildData))
                guildsWithAnniversaryMessage.push(guild);

            // We now have the full, filtered, list of guildsWithAnniversaryMessage
        }

        // We should now have the filtered lists of birthdayMessageGuildMembers, memberAnniversaryMessageGuildMembers, and guildsWithAnniversaryMessage
        // as well as the filtered lists of addBirthdayRoleGuildMembers, removeBirthdayRoleGuildMembers, and anniversaryRoleGuildMembers
        // This means we should be able to call the MessageService & the RoleService

        this.messageService.run(
            this.client,
            guildCelebrationDatas,
            birthdayMessageGuildMembers,
            memberAnniversaryMessageGuildMembers,
            guildsWithAnniversaryMessage,
            premiumGuildIds
        );

        this.roleService.run(
            this.client,
            guildCelebrationDatas,
            addBirthdayRoleGuildMembers,
            removeBirthdayRoleGuildMembers,
            anniversaryRoleGuildMembers,
            premiumGuildIds
        );
    }

    public start(): void {
        // TODO: change logs
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
