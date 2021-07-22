import {
    BirthdayMemberRoleStatus,
    BirthdayMessageGuildMembers,
    BirthdayRoleGuildMembers,
    MemberAnniversaryMessageGuildMembers,
    MemberAnniversaryRoleGuildMembers,
    SubscriptionStatus,
} from '../models';
import { CelebrationUtils, TimeUtils } from '../utils';
import { Client, Collection, Guild, GuildMember, Role, TextChannel } from 'discord.js';
import { CombinedRepo, UserRepo } from '../services/database/repos';
import { Logger, MessageService, RoleService, SubscriptionService } from '../services';
import { MemberAnniversaryRole, UserData } from '../models/database';

import { Job } from './job';
import moment from 'moment';
import { performance } from 'perf_hooks';
import schedule from 'node-schedule';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CelebrationJob implements Job {
    public name = 'Celebration';
    public schedule: string = Config.jobs.postCelebrationJob.schedule;
    public log: boolean = Config.jobs.postCelebrationJob.log;
    public interval: number = Config.jobs.postCelebrationJob.interval;

    constructor(
        private client: Client,
        private userRepo: UserRepo,
        private combinedRepo: CombinedRepo,
        private messageService: MessageService,
        private roleService: RoleService,
        private subscriptionService: SubscriptionService
    ) {}

    public async run(): Promise<void> {
        Logger.info('Started fetching database information for guilds and users...');
        let startCalculating = performance.now();
        let now = moment();
        let today = now.clone().format('MM-DD');
        let tomorrow = now.clone().add(1, 'day').format('MM-DD');
        let yesterday = now.clone().subtract(1, 'day').format('MM-DD');

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
        // Get list of guilds the client is connected to
        let discordIds = guildCache.map(guild => guild.id);

        // String of guild ids who have an active subscription to birthday bot premium
        // TODO: Update APS to allow us the get all active subscribers so we can initialize this array
        let subStatuses: SubscriptionStatus[];

        try {
            subStatuses = await this.subscriptionService.getAllSubscription('premium-1');
        } catch (error) {
            // Could not fetch subscription data
        }

        let premiumGuildIds: string[] =
            Config.payments.enabled && subStatuses
                ? subStatuses.filter(g => g?.service).map(g => g?.subscriber) ?? discordIds
                : discordIds;

        // Get the data from the database
        let guildCelebrationDatas = CelebrationUtils.convertCelebrationData(
            await this.combinedRepo.GetRawCelebrationData(discordIds)
        );

        let endCalculating = performance.now();
        Logger.info(
            `Finished fetching database information for guilds and users in ${
                (endCalculating - startCalculating) / 1000
            }s`
        );

        Logger.info(
            Logs.info.birthdayJobGuildCount.replace(
                '{GUILD_COUNT}',
                guildCelebrationDatas.length.toLocaleString()
            )
        );

        // Object to send the message service for birthday message members
        let guildBirthdayMessageMemberData: BirthdayMessageGuildMembers[] = [];

        // Object to send the role service for birthday role members
        let guildBirthdayRoleData: BirthdayRoleGuildMembers[] = [];

        // Object to send the message service for server anniversary message servers
        let guildAnniversaryMessageMemberData: MemberAnniversaryMessageGuildMembers[] = [];

        // Object to send the role service for member anniversary role members
        let guildAnniversaryRoleMemberData: MemberAnniversaryRoleGuildMembers[] = [];

        let guildsWithAnniversaryMessage: TextChannel[] = [];

        Logger.info(`Start calculating all guild data...`);
        let startCalculating2 = performance.now();

        for (let guildInCache of guildCache.array()) {
            let guild = guildInCache;
            try {
                guild = await this.client.guilds.fetch(guildInCache.id);
            } catch (error) {
                await TimeUtils.sleep(200);
                continue;
            }
            let hasPremium = premiumGuildIds.includes(guild.id);
            let guildMembers: Collection<string, GuildMember> = guild.members.cache;

            // Get the guildData for this guild
            let guildData = guildCelebrationDatas.find(
                data => data.guildData.GuildDiscordId === guild.id
            )?.guildData;

            // Get the blacklist for this guild
            let blacklist = guildCelebrationDatas
                .find(data => data.guildData.GuildDiscordId === guild.id)
                ?.blacklistedMembers.map(data => data.UserDiscordId);

            let birthdayChannel: TextChannel;
            let memberAnniversaryChannel: TextChannel;
            let serverAnniversaryChannel: TextChannel;
            let birthdayRole: Role;

            if (!guildData) continue;

            if (guildData.BirthdayChannelDiscordId !== '0') {
                try {
                    birthdayChannel = guild.channels.resolve(
                        guildData.BirthdayChannelDiscordId
                    ) as TextChannel;
                } catch (error) {
                    // No birthday channel
                }
            }

            if (guildData.BirthdayRoleDiscordId !== '0') {
                try {
                    birthdayRole = guild.roles.resolve(guildData.BirthdayRoleDiscordId) as Role;
                } catch (error) {
                    // No Birthday Role
                }
            }

            // If either are set we have to calculate birthday information
            if (birthdayChannel || birthdayRole) {
                let membersWithBirthdayTodayOrTomorrow = guildMembers
                    .filter(
                        member =>
                            CelebrationUtils.isBirthdayTodayOrYesterday(
                                birthdayUserData.find(data => data.UserDiscordId === member.id),
                                guildData
                            ) && !blacklist.includes(member.id)
                    )
                    .array();

                let birthdayMemberStatuses = membersWithBirthdayTodayOrTomorrow.map(m =>
                    CelebrationUtils.getBirthdayMemberStatus(
                        birthdayUserData.find(data => data.UserDiscordId === m.id),
                        m,
                        guildData
                    )
                );

                if (birthdayChannel) {
                    // Calculate who needs the birthday message & push them to BirthdayMessageGuildMembers
                    guildBirthdayMessageMemberData.push(
                        new BirthdayMessageGuildMembers(
                            birthdayChannel,
                            birthdayMemberStatuses.filter(m => m.needsMessage).map(m => m.member)
                        )
                    );
                }

                if (birthdayRole) {
                    // Calculate the give and take for birthday roles
                    guildBirthdayRoleData.push(
                        new BirthdayRoleGuildMembers(
                            birthdayRole,
                            birthdayMemberStatuses
                                .filter(m => m.needsRoleAdded || m.needsRoleRemoved)
                                .map(
                                    m =>
                                        new BirthdayMemberRoleStatus(
                                            m.member,
                                            m.needsRoleAdded || m.needsRoleRemoved
                                        )
                                )
                        )
                    );
                }
            }

            if (guildData.MemberAnniversaryChannelDiscordId !== '0') {
                try {
                    memberAnniversaryChannel = guild.channels.resolve(
                        guildData.MemberAnniversaryChannelDiscordId
                    ) as TextChannel;
                } catch (error) {
                    // No member anniversary channel
                }
            }

            // Get the member anniversaries for this guild if they have premium
            let memberAnniversaryRoles: MemberAnniversaryRole[];

            if (hasPremium) {
                memberAnniversaryRoles = guildCelebrationDatas.find(
                    data => data.guildData.GuildDiscordId === guild.id
                )?.anniversaryRoles;
            }

            if (
                memberAnniversaryChannel ||
                (memberAnniversaryRoles && memberAnniversaryRoles.length > 0)
            ) {
                let anniversaryMemberStatuses = guildMembers.map(m =>
                    CelebrationUtils.getAnniversaryMemberStatuses(
                        m,
                        guildData,
                        memberAnniversaryRoles
                    )
                );

                if (memberAnniversaryChannel) {
                    guildAnniversaryMessageMemberData.push(
                        new MemberAnniversaryMessageGuildMembers(
                            memberAnniversaryChannel,
                            anniversaryMemberStatuses.filter(m => m.needsMessage).map(m => m.member)
                        )
                    );
                }

                if (memberAnniversaryRoles && memberAnniversaryRoles.length > 0) {
                    // Test that this removes duplicates
                    let statuses = anniversaryMemberStatuses.filter(r => r.role);
                    let giveRoles = [...new Set(statuses.map(m => m.role))];
                    for (let role of giveRoles) {
                        guildAnniversaryRoleMemberData.push(
                            new MemberAnniversaryRoleGuildMembers(
                                role,
                                statuses.filter(m => m.role === role).map(m => m.member)
                            )
                        );
                    }
                }
            }

            if (guildData.ServerAnniversaryChannelDiscordId !== '0') {
                try {
                    serverAnniversaryChannel = guild.channels.resolve(
                        guildData.ServerAnniversaryChannelDiscordId
                    ) as TextChannel;
                } catch (error) {
                    // No server anniversary channel
                }

                if (
                    serverAnniversaryChannel &&
                    CelebrationUtils.isServerAnniversaryMessage(guild, guildData)
                ) {
                    guildsWithAnniversaryMessage.push(serverAnniversaryChannel);
                }
            }
        }

        let endCalculating2 = performance.now();
        Logger.info(
            `Finished calculating all guild data in ${
                (endCalculating2 - startCalculating2) / 1000
            }s`
        );

        // We should now have the filtered lists of birthdayMessageGuildMembers, memberAnniversaryMessageGuildMembers, and guildsWithAnniversaryMessage
        // as well as the filtered lists of addBirthdayRoleGuildMembers, removeBirthdayRoleGuildMembers, and anniversaryRoleGuildMembers
        // This means we should be able to call the MessageService & the RoleService

        Logger.info(Logs.info.messageServiceRun);
        Logger.info(Logs.info.roleServiceRun);

        let services = [];

        let messageGuildIds = [
            ...guildBirthdayMessageMemberData.map(data => data.birthdayChannel.guild.id),
            ...guildAnniversaryMessageMemberData.map(
                data => data.memberAnniversaryChannel.guild.id
            ),
            ...guildsWithAnniversaryMessage.map(data => data.guild.id),
        ];

        let roleGuildIds = [
            ...guildBirthdayRoleData.map(data => data.role.guild.id),
            ...[
                new Set(
                    guildAnniversaryRoleMemberData.map(data => data.memberAnniversaryRole.guild.id)
                ),
            ],
        ];

        services.push(
            this.messageService
                .run(
                    this.client,
                    guildCelebrationDatas.filter(data =>
                        messageGuildIds.includes(data.guildData.GuildDiscordId)
                    ),
                    guildBirthdayMessageMemberData,
                    guildAnniversaryMessageMemberData,
                    guildsWithAnniversaryMessage,
                    premiumGuildIds
                )
                .catch(error => {
                    // Error running the service
                })
        );

        services.push(
            this.roleService
                .run(
                    this.client,
                    guildCelebrationDatas.filter(data =>
                        roleGuildIds.includes(data.guildData.GuildDiscordId)
                    ),
                    guildBirthdayRoleData,
                    guildAnniversaryRoleMemberData,
                    premiumGuildIds
                )
                .catch(error => {
                    // Error running the service
                })
        );

        await Promise.allSettled(services);
        Logger.info(Logs.info.messageServiceCompleted);
        Logger.info(Logs.info.roleServiceCompleted);
    }

    public start(): void {
        // TODO: change logs
        schedule.scheduleJob(this.schedule, async () => {
            try {
                Logger.info(Logs.info.birthdayJobStarted);
                await this.run();
                // Logger.info(Logs.info.completedBirthdayJob);
            } catch (error) {
                Logger.error(Logs.error.birthdayJob, error);
            }
        });
    }
}
