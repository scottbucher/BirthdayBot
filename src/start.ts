import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Options } from 'discord.js';
import { createRequire } from 'node:module';

import { Bot } from './bot.js';
import { BlacklistButton, Button } from './buttons/index.js';
import {
    BlacklistAddSubCommand,
    BlacklistClearSubCommand,
    BlacklistListSubCommand,
    BlacklistRemoveIdSubCommand,
    BlacklistRemoveRoleOrUserSubCommand,
} from './commands/blacklist/index.js';
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
} from './commands/config/index.js';
import {
    BlacklistCommand,
    Command,
    ConfigCommand,
    DonateCommand,
    HelpCommand,
    InfoCommand,
    LinkCommand,
    ListCommand,
    MapCommand,
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
} from './commands/index.js';
import { MemberAnniversaryRoleCommand } from './commands/mar-command.js';
import {
    MarAddSubCommand,
    MarClearSubCommand,
    MarListSubCommand,
    MarRemoveSubCommand,
} from './commands/mar/index.js';
import { MessageCommand } from './commands/message-command.js';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageEditColorSubCommand,
    MessageEditEmbedSubCommand,
    MessageListSubCommand,
    MessageRemoveSubCommand,
    MessageSettingMentionSubCommand,
    MessageSettingTimeSubCommand,
    MessageTestSubCommand,
} from './commands/message/index.js';
import {
    TrustedRoleAddSubCommand,
    TrustedRoleClearSubCommand,
    TrustedRoleListSubCommand,
    TrustedRoleRemoveIdSubCommand,
    TrustedRoleRemoveRoleSubCommand,
} from './commands/trusted-role/index.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events/index.js';
import { CustomClient } from './extensions/index.js';
import { Job } from './jobs/index.js';
import { Reaction } from './reactions/index.js';
import { DataAccess } from './services/database/index.js';
import {
    BlacklistRepo,
    CombinedRepo,
    CustomMessageRepo,
    GuildRepo,
    MemberAnniversaryRoleRepo,
    TrustedRoleRepo,
    UserRepo,
} from './services/database/repos/index.js';
import { HttpService, JobService, Logger, SubscriptionService } from './services/index.js';
import { OldPrefixTrigger, Trigger } from './triggers/index.js';

const require = createRequire(import.meta.url);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    let blacklistRemoveRoleOrUserSubCommand = new BlacklistRemoveRoleOrUserSubCommand(
        blacklistRepo
    );
    let blacklistRemoveIdSubCommand = new BlacklistRemoveIdSubCommand(blacklistRepo);
    let blacklistListSubCommand = new BlacklistListSubCommand(blacklistRepo);

    // Trusted Role Sub Commands
    let trustedRoleAddSubCommand = new TrustedRoleAddSubCommand(trustedRoleRepo);
    let trustedRoleClearSubCommand = new TrustedRoleClearSubCommand(trustedRoleRepo);
    let trustedRoleRemoveRoleSubCommand = new TrustedRoleRemoveRoleSubCommand(trustedRoleRepo);
    let trustedRoleRemoveIdSubCommand = new TrustedRoleRemoveIdSubCommand(trustedRoleRepo);
    let trustedRoleListSubCommand = new TrustedRoleListSubCommand(trustedRoleRepo);

    //  Mar Sub Commands
    let marAddSubCommand = new MarAddSubCommand(memberAnniversaryRoleRepo);
    let marClearSubCommand = new MarClearSubCommand(memberAnniversaryRoleRepo);
    let marRemoveSubCommand = new MarRemoveSubCommand(memberAnniversaryRoleRepo);
    let marListSubCommand = new MarListSubCommand(memberAnniversaryRoleRepo);

    // Message Sub Commands
    let messageAddSubCommand = new MessageAddSubCommand(customMessageRepo);
    let messageClearSubCommand = new MessageClearSubCommand(customMessageRepo);
    let messageRemoveSubCommand = new MessageRemoveSubCommand(customMessageRepo);
    let messageTestSubCommand = new MessageTestSubCommand(customMessageRepo);
    let messageListSubCommand = new MessageListSubCommand(customMessageRepo);

    // Message Setting Sub Commands
    let messageSettingMentionSubCommand = new MessageSettingMentionSubCommand(guildRepo);
    let messageSettingTimeSubCommand = new MessageSettingTimeSubCommand(guildRepo);

    // Message Edit Sub Commands
    let messageEditEmbedSubCommand = new MessageEditEmbedSubCommand(customMessageRepo);
    let messageEditColorSubCommand = new MessageEditColorSubCommand(customMessageRepo);

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
        new BlacklistCommand([
            blacklistAddSubCommand,
            blacklistClearSubCommand,
            blacklistRemoveRoleOrUserSubCommand,
            blacklistRemoveIdSubCommand,
            blacklistListSubCommand,
        ]),
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
        new MessageCommand([
            messageAddSubCommand,
            messageClearSubCommand,
            messageRemoveSubCommand,
            messageTestSubCommand,
            messageListSubCommand,
            messageSettingMentionSubCommand,
            messageSettingTimeSubCommand,
            messageEditEmbedSubCommand,
            messageEditColorSubCommand,
        ]),
        new MemberAnniversaryRoleCommand([
            marAddSubCommand,
            marClearSubCommand,
            marRemoveSubCommand,
            marListSubCommand,
        ]),
        new TrustedRoleCommand([
            trustedRoleAddSubCommand,
            trustedRoleClearSubCommand,
            trustedRoleRemoveRoleSubCommand,
            trustedRoleRemoveIdSubCommand,
            trustedRoleListSubCommand,
        ]),
        new SetupCommand(guildRepo),
        new SettingsCommand(trustedRoleRepo),
        new SetAttemptsCommand(userRepo),
        new ListCommand(userRepo),
        new NextCommand(userRepo),
        new ViewCommand(userRepo),
        new SetCommand(guildRepo, userRepo),
        new MapCommand(),
        new PurgeCommand(userRepo),
        new PremiumCommand(),
        new SubscribeCommand(subService),
        new VoteCommand(),
        new DonateCommand(),
    ].sort((a, b) => (a.metadata.name > b.metadata.name ? 1 : -1));

    // Buttons
    let buttons: Button[] = [new BlacklistButton(blacklistRepo)];

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
    let buttonHandler = new ButtonHandler(buttons);
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
        buttonHandler,
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

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
