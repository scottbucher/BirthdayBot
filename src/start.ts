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
} from './commands';
import {
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { HttpService, JobService, Logger, SubscriptionService } from './services';
import {
    BlacklistRepo,
    CombinedRepo,
    CustomMessageRepo,
    GuildRepo,
    MemberAnniversaryRoleRepo,
    TrustedRoleRepo,
    UserRepo,
} from './services/database/repos';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/rest/v9';
import { Options } from 'discord.js';
import { Bot } from './bot';
import { VoteCommand } from './commands/vote-command';
import { CustomClient } from './extensions';
import { Reaction } from './reactions';
import { DataAccess } from './services/database/data-access';
import { Trigger } from './triggers';

const Config = require('../config/config.json');
const Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info('Starting Bot!');
    const client = new CustomClient({
        intents: Config.client.intents,
        partials: Config.client.partials,
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.defaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });

    const dataAccess = new DataAccess(Config.mysql);
    const httpService = new HttpService();
    const subService = new SubscriptionService(httpService);

    // Repos
    const guildRepo = new GuildRepo(dataAccess);
    const userRepo = new UserRepo(dataAccess);
    const customMessageRepo = new CustomMessageRepo(dataAccess);
    const blacklistRepo = new BlacklistRepo(dataAccess);
    const trustedRoleRepo = new TrustedRoleRepo(dataAccess);
    const memberAnniversaryRoleRepo = new MemberAnniversaryRoleRepo(dataAccess);
    const combinedRepo = new CombinedRepo(dataAccess);

    // Commands
    const commands: Command[] = [
        new HelpCommand(),
        new InfoCommand(),
        new LinkCommand(),
        new TestCommand(),
        new BlacklistCommand(),
        new ConfigCommand(),
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
    const reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    const triggers: Trigger[] = [
        // TODO: Add new triggers here
    ];

    // Event handlers
    const guildJoinHandler = new GuildJoinHandler();
    const guildLeaveHandler = new GuildLeaveHandler();
    const commandHandler = new CommandHandler(commands, subService, guildRepo, userRepo);
    const triggerHandler = new TriggerHandler(triggers);
    const messageHandler = new MessageHandler(triggerHandler);
    const reactionHandler = new ReactionHandler(reactions);

    const bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        reactionHandler,
        new JobService([])
    );

    if (process.argv[2] === '--register') {
        await registerCommands(commands);
        process.exit();
    }

    await bot.start();
}

async function registerCommands(commands: Command[]): Promise<void> {
    const cmdDatas = commands.map(cmd => cmd.metadata);
    const cmdNames = cmdDatas.map(cmdData => cmdData.name);

    Logger.info(
        Logs.info.commandsRegistering.replaceAll(
            '{COMMAND_NAMES}',
            cmdNames.map(cmdName => `'${cmdName}'`).join(', ')
        )
    );

    try {
        const rest = new REST({ version: '9' }).setToken(Config.client.token);
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
