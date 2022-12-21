import { REST } from '@discordjs/rest';
import { Options, Partials } from 'discord.js';
import { createRequire } from 'node:module';

import { Button } from './buttons/index.js';
import {
    HelpCommand,
    InfoCommand,
    LinkCommand,
    ListCommand,
    MapCommand,
    NextCommand,
    PremiumCommand,
    PurgeCommand,
    SetCommand,
    SubscribeCommand,
    SuggestCommand,
    ViewCommand,
    VoteCommand,
} from './commands/chat/index.js';
import {
    ChatCommandMetadata,
    Command,
    MessageCommandMetadata,
    UserCommandMetadata,
} from './commands/index.js';
import { Database } from './database/database.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
} from './events/index.js';
import { CustomClient } from './extensions/index.js';
import { Job } from './jobs/index.js';
import { Bot } from './models/bot.js';
import {
    CommandRegistrationService,
    EventDataService,
    HttpService,
    JobService,
    Logger,
    SubscriptionService,
} from './services/index.js';

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    // Database
    let orm = await Database.connect();

    // Services
    let eventDataService = new EventDataService(orm);

    // Client
    let client = new CustomClient({
        intents: Config.client.intents,
        partials: (Config.client.partials as string[]).map(partial => Partials[partial]),
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.DefaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });
    let httpService = new HttpService();
    let subService = new SubscriptionService(httpService);

    // Commands
    let commands: Command[] = [
        // Chat Commands
        new HelpCommand(),
        new VoteCommand(),
        new ViewCommand(),
        new InfoCommand(),
        new LinkCommand(),
        new ListCommand(),
        new MapCommand(),
        new NextCommand(),
        new PremiumCommand(subService),
        new PurgeCommand(),
        new SetCommand(),
        new SuggestCommand(),
        new SubscribeCommand(subService),
        // Message Context Commands
        // User Context Commands
        // TODO: Add new commands here
    ];

    // Buttons
    let buttons: Button[] = [
        // TODO: Add new buttons here
    ];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler(eventDataService);
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(commands, eventDataService);
    let buttonHandler = new ButtonHandler(buttons, eventDataService, subService);

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
        commandHandler,
        buttonHandler,
        new JobService(jobs)
    );

    // Register
    if (process.argv[2] == 'commands') {
        try {
            let rest = new REST({ version: '10' }).setToken(Config.client.token);
            let commandRegistrationService = new CommandRegistrationService(rest);
            let localCmds = [
                ...Object.values(ChatCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
                ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            ];
            await commandRegistrationService.process(localCmds, process.argv);
        } catch (error) {
            Logger.error(Logs.error.commandAction, error);
        }
        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit();
    }

    await bot.start();
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
