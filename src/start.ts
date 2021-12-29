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
    BlacklistRepo,
    CombinedRepo,
    CustomMessageRepo,
    GuildRepo,
    MemberAnniversaryRoleRepo,
    TrustedRoleRepo,
    UserRepo,
} from './services/database/repos';
import {
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { HttpService, JobService, Logger } from './services';

import { Bot } from './bot';
import { CustomClient } from './extensions';
import { DataAccess } from './services/database/data-access';
import { Options } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Reaction } from './reactions';
import { Routes } from 'discord-api-types/rest/v9';
import { Trigger } from './triggers';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info('Starting Bot!');
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

    // Repos
    let guildRepo = new GuildRepo(dataAccess);
    let userRepo = new UserRepo(dataAccess);
    let customMessageRepo = new CustomMessageRepo(dataAccess);
    let blacklistRepo = new BlacklistRepo(dataAccess);
    let trustedRoleRepo = new TrustedRoleRepo(dataAccess);
    let memberAnniversaryRoleRepo = new MemberAnniversaryRoleRepo(dataAccess);
    let combinedRepo = new CombinedRepo(dataAccess);

    // Commands
    let commands: Command[] = [
        new HelpCommand(),
        new InfoCommand(),
        new LinkCommand(),
        new TestCommand(),
        new BlacklistCommand(),
        new ConfigCommand(),
        new MessageCommand(),
        new MemberAnniversaryRoleCommand(),
        new TrustedRoleCommand(),
        new SetupCommand(),
        new SettingsCommand(),
        new SetAttemptsCommand(),
        new ListCommand(),
        new NextCommand(),
        new ViewCommand(),
        new SetCommand(),
        new MapCommand(),
        new PurgeCommand(userRepo),
        new PremiumCommand(),
        new SubscribeCommand(),
    ].sort((a, b) => (a.metadata.name > b.metadata.name ? 1 : -1));

    // Reactions
    let reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    let triggers: Trigger[] = [
        // TODO: Add new triggers here
    ];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(commands);
    let triggerHandler = new TriggerHandler(triggers);
    let messageHandler = new MessageHandler(triggerHandler);
    let reactionHandler = new ReactionHandler(reactions);

    let bot = new Bot(
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
