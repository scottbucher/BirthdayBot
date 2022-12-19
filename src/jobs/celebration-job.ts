// import {
//     Client,
//     Collection,
//     DiscordAPIError,
//     RESTJSONErrorCodes as DiscordApiErrors,
//     Guild,
//     GuildMember,
// } from 'discord.js';
// import schedule from 'node-schedule';
// import { createRequire } from 'node:module';
// import { performance } from 'node:perf_hooks';

// import { UserData } from '../models/database/index.js';
// import { SubscriptionStatus } from '../models/index.js';
// import { CelebrationService, Logger, SubscriptionService } from '../services/index.js';
// import { CelebrationUtils, TimeUtils } from '../utils/index.js';
// import { Job } from './index.js';

// const require = createRequire(import.meta.url);
// let Config = require('../../config/config.json');
// let Logs = require('../../lang/logs.json');

// const IGNORED_ERRORS = [
//     DiscordApiErrors.UnknownMessage,
//     DiscordApiErrors.UnknownChannel,
//     DiscordApiErrors.UnknownGuild,
//     DiscordApiErrors.UnknownUser,
//     DiscordApiErrors.UnknownInteraction,
//     DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
//     DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
//     DiscordApiErrors.MaximumActiveThreads,
// ];

// export class CelebrationJob implements Job {
//     public name = 'Celebration';
//     public schedule: string = Config.jobs.postCelebrationJob.schedule;
//     public log: boolean = Config.jobs.postCelebrationJob.log;
//     public interval: number = Config.jobs.postCelebrationJob.interval;

//     constructor(
//         private client: Client,
//         private userRepo: UserRepo,
//         private combinedRepo: CombinedRepo,
//         private celebrationService: CelebrationService,
//         private subscriptionService: SubscriptionService
//     ) {}

//     public async run(): Promise<void> {
//         Logger.info('Started fetching database information for guilds and users...');
//         let startCalculating = performance.now();
//         let now = moment();
//         let today = now.clone().format('LL-dd');
//         let tomorrow = now.clone().add(1, 'day').format('LL-dd');
//         let yesterday = now.clone().subtract(1, 'day').format('LL-dd');

//         // Get a user data list of all POSSIBLE birthday events, this includes birthday role, message AND role take.
//         // Do to timezones and custom message time this can range by a day, thus we get 3 days worth of birthdays for each check
//         let birthdayUserData: UserData[] = [
//             ...(await this.userRepo.getUsersWithBirthday(today)),
//             ...(await this.userRepo.getUsersWithBirthday(tomorrow)),
//             ...(await this.userRepo.getUsersWithBirthday(yesterday)),
//         ];

//         if (
//             !TimeUtils.isLeap(now.year()) &&
//             (today === '02-28' || tomorrow === '02-28' || yesterday === '02-28')
//         ) {
//             // Add leap year birthdays to list
//             birthdayUserData.push(...(await this.userRepo.getUsersWithBirthday('02-29')));
//         }
//         // Collection of guilds
//         let guildCache = this.client.guilds.cache;
//         // Get list of guilds the client is connected to
//         let discordIds = guildCache.map(guild => guild.id);

//         // String of guild ids who have an active subscription to birthday bot premium
//         let subStatuses: SubscriptionStatus[];

//         try {
//             subStatuses = await this.subscriptionService.getAllSubscription('premium-1');
//         } catch (error) {
//             // Could not fetch subscription data
//         }

//         let premiumGuildIds: string[] =
//             Config.payments.enabled && subStatuses
//                 ? subStatuses.filter(g => g?.service).map(g => g?.subscriber) ?? discordIds
//                 : discordIds;

//         // Remove guilds that are premium
//         let nonPremiumIds = discordIds.filter(id => !premiumGuildIds.includes(id));

//         // Combine arrays with premium guilds at the front
//         let orderedGuildIds = premiumGuildIds.concat(nonPremiumIds);

//         // Get the data from the database
//         let guildCelebrationDatas = CelebrationUtils.convertCelebrationData(
//             await this.combinedRepo.GetRawCelebrationData(orderedGuildIds)
//         );

//         let promises = [];
//         for (let guildCelebrationData of guildCelebrationDatas) {
//             // Resolve Guild
//             let guildData = guildCelebrationData.guildData;
//             let guild: Guild;
//             try {
//                 guild = await this.client.guilds.fetch(guildData.GuildDiscordId);
//                 if (!guild) continue;
//             } catch (error) {
//                 // Ignore when we get missing access errors which are when we try and fetch guilds which no longer have the bot
//                 if (
//                     error instanceof DiscordAPIError &&
//                     typeof error.code == 'number' &&
//                     IGNORED_ERRORS.includes(error.code)
//                 ) {
//                     continue;
//                 }

//                 Logger.error(
//                     Logs.error.resolveGuild
//                         .replaceAll('{GUILD_ID}', guildData?.GuildDiscordId)
//                         .replaceAll('{GUILD_NAME}', guild?.name),
//                     error
//                 );
//                 continue;
//             }

//             try {
//                 let members: Collection<string, GuildMember> = guild.members.cache;

//                 let hasPremium = !Config.payments.enabled || premiumGuildIds.includes(guild.id);

//                 promises.push(
//                     this.celebrationService
//                         .run(
//                             guild,
//                             guildCelebrationData,
//                             birthdayUserData,
//                             members.map(m => m),
//                             hasPremium
//                         )
//                         .catch(error => {
//                             Logger.error(
//                                 Logs.error.celebrateBirthday
//                                     .replaceAll('{GUILD_NAME}', guild?.name)
//                                     .replaceAll('{GUILD_ID}', guild?.id),
//                                 error
//                             );
//                         })
//                 );
//             } catch (error) {
//                 Logger.error(
//                     Logs.error.birthdayService
//                         .replaceAll('{GUILD_ID}', guildData?.GuildDiscordId)
//                         .replaceAll('{GUILD_NAME}', guild?.name)
//                         .replaceAll('{MEMBER_COUNT}', guild?.memberCount.toLocaleString())
//                         .replaceAll(
//                             '{MEMBER_CACHE_COUNT}',
//                             guild?.members.cache.size.toLocaleString()
//                         ),
//                     error
//                 );
//                 continue;
//             }

//             await TimeUtils.sleep(this.interval);
//         }

//         Logger.info(
//             `Finished calculating all guild promises... waiting for them to finish. ${
//                 (performance.now() - startCalculating) / 1000
//             }s`
//         );
//         await Promise.allSettled(promises);
//         Logger.info(
//             `All guilds have finished running the celebration service. Total time of ${
//                 (performance.now() - startCalculating) / 1000
//             }s`
//         );
//     }

//     public start(): void {
//         // TODO: change logs
//         schedule.scheduleJob(this.schedule, async () => {
//             try {
//                 Logger.info(Logs.info.birthdayJobStarted);
//                 await this.run();
//                 // Logger.info(Logs.info.completedBirthdayJob);
//             } catch (error) {
//                 Logger.error(Logs.error.birthdayJob, error);
//             }
//         });
//     }
// }
