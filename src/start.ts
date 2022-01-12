import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/rest/v9';
import { Options } from 'discord.js';

import { Bot } from './bot';
import {
    BlacklistCommand,
    Command,
    ConfigCommand,
    HelpCommand,
    InfoCommand,
    LinkCommand,
    ListCommand,
    MapCommand,
    MemberAnniversaryRoleCommand,
    MessageCommand,
    NextCommand,
    PremiumCommand,
    PurgeCommand,
    SetAttemptsCommand,
    SetCommand,
    SettingsCommand,
    SetupCommand,
    SubscribeCommand,
    TestCommand,
    TrustedRoleCommand,
    ViewCommand,
    VoteCommand,
} from './commands';
import { BlacklistAddSubCommand, BlacklistClearSubCommand } from './commands/blacklist';
import {
    ChannelSubCommand,
    DateFormatSubCommand,
    NameFormatSubCommand,
    RequireAllTrustedRolesSubCommand,
    RoleSubCommand,
    TimezoneSubCommand,
    TrustedPreventsMsgSubCommand,
    TrustedPreventsRoleSubCommand,
    UseTimezoneSubCommand,
} from './commands/config-settings';
import {
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { CustomClient } from './extensions';
import { Job } from './jobs';
import { Reaction } from './reactions';
import { HttpService, JobService, Logger, SubscriptionService } from './services';
import { DataAccess } from './services/database/data-access';
import {
    BlacklistRepo,
    CombinedRepo,
    CustomMessageRepo,
    GuildRepo,
    MemberAnniversaryRoleRepo,
    TrustedRoleRepo,
    UserRepo,
} from './services/database/repos';
import { OldPrefixTrigger, Trigger } from './triggers';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info('Starting Bot!');

    // Client
    let client = new CustomClient({
        intents: Config.client.intents,
        partials: Config.client.partials,
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.defaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });

    let dataAccess = new DataAccess(Config.mysql);
    let httpService = new HttpService();
    let subService = new SubscriptionService(httpService);

    // Repos
    let guildRepo = new GuildRepo(dataAccess);
    let userRepo = new UserRepo(dataAccess);
    let customMessageRepo = new CustomMessageRepo(dataAccess);
    let blacklistRepo = new BlacklistRepo(dataAccess);
    let trustedRoleRepo = new TrustedRoleRepo(dataAccess);
    let memberAnniversaryRoleRepo = new MemberAnniversaryRoleRepo(dataAccess);
    let combinedRepo = new CombinedRepo(dataAccess);

    // Config Sub Commands
    let nameFormatSubCommand = new NameFormatSubCommand(guildRepo);
    let timezoneSubCommand = new TimezoneSubCommand(guildRepo);
    let useTimezoneSubCommand = new UseTimezoneSubCommand(guildRepo);
    let dateFormatSubCommand = new DateFormatSubCommand(guildRepo);
    let trustedPreventsMessageSubCommand = new TrustedPreventsMsgSubCommand(guildRepo);
    let trustedPreventsRoleSubCommand = new TrustedPreventsRoleSubCommand(guildRepo);
    let requireAllTrustedRolesSubCommand = new RequireAllTrustedRolesSubCommand(guildRepo);
    let channelSubCommand = new ChannelSubCommand(guildRepo);
    let roleSubCommand = new RoleSubCommand(guildRepo);

    // Blacklist Sub Commands
    let blacklistAddSubCommand = new BlacklistAddSubCommand(blacklistRepo);
    let blacklistClearSubCommand = new BlacklistClearSubCommand(blacklistRepo);

    // Commands
    let commands: Command[] = [
        new HelpCommand(),
        new InfoCommand(),
        new LinkCommand(),
        new TestCommand(
            userRepo,
            blacklistRepo,
            trustedRoleRepo,
            customMessageRepo,
            memberAnniversaryRoleRepo
        ),
        new BlacklistCommand([blacklistAddSubCommand, blacklistClearSubCommand]),
        new ConfigCommand([
            nameFormatSubCommand,
            timezoneSubCommand,
            useTimezoneSubCommand,
            dateFormatSubCommand,
            trustedPreventsMessageSubCommand,
            trustedPreventsRoleSubCommand,
            requireAllTrustedRolesSubCommand,
            channelSubCommand,
            roleSubCommand,
        ]),
        new MessageCommand(),
        new MemberAnniversaryRoleCommand(),
        new TrustedRoleCommand(),
        new SetupCommand(guildRepo),
        new SettingsCommand(trustedRoleRepo),
        new SetAttemptsCommand(userRepo),
        new ListCommand(),
        new NextCommand(userRepo),
        new ViewCommand(userRepo),
        new SetCommand(guildRepo, userRepo),
        new MapCommand(),
        new PurgeCommand(userRepo),
        new PremiumCommand(),
        new SubscribeCommand(subService),
        new VoteCommand(),
    ].sort((a, b) => (a.metadata.name > b.metadata.name ? 1 : -1));

    // Reactions
    let reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    let triggers: Trigger[] = [new OldPrefixTrigger()];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(commands, subService, guildRepo, userRepo);
    let triggerHandler = new TriggerHandler(triggers);
    let messageHandler = new MessageHandler(triggerHandler);
    let reactionHandler = new ReactionHandler(reactions);

    // Jobs
    let jobs: Job[] = [
        // TODO: Add new jobs here
    ];

    // Bot
    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        reactionHandler,
        new JobService(jobs)
    );

    // Register
    if (process.argv[2] === '--register') {
        await registerCommands(commands);
        process.exit();
    }

    await bot.start();
}

async function registerCommands(commands: Command[]): Promise<void> {
    let cmdDatas = commands.map(cmd => cmd.metadata);
    let cmdNames = cmdDatas.map(cmdData => cmdData.name);

    Logger.info(
        Logs.info.commandsRegistering.replaceAll(
            '{COMMAND_NAMES}',
            cmdNames.map(cmdName => `'${cmdName}'`).join(', ')
        )
    );

    try {
        let rest = new REST({ version: '9' }).setToken(Config.client.token);
        await rest.put(Routes.applicationCommands(Config.client.id), { body: [] });
        await rest.put(Routes.applicationCommands(Config.client.id), { body: cmdDatas });
    } catch (error) {
        Logger.error(Logs.error.commandsRegistering, error);
        return;
    }

    Logger.info(Logs.info.commandsRegistered);
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
