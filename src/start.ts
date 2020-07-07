import { BirthdayService, Logger } from './services';
import {
    ClearCommand,
    CreateCommand,
    DefaultHelpCommand,
    InviteCommand,
    ListCommand,
    MapCommand,
    MessageCommand,
    NextCommand,
    PurgeCommand,
    SetAttemptsCommand,
    SetCommand,
    SettingsCommand,
    SetupCommand,
    SupportCommand,
    TrustedCommand,
    UpdateCommand,
    ViewCommand,
} from './commands';
import { Client, ClientOptions, PartialTypes } from 'discord.js';
import { CustomMessageRepo, GuildRepo, UserRepo } from './services/database/repos';
import { GuildJoinHandler, GuildLeaveHandler, MessageHandler, ReactionAddHandler } from './events';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageEmbedSubCommand,
    MessageListSubCommand,
    MessageMentionSubCommand,
    MessageRemoveSubCommand,
    MessageTestSubCommand,
    MessageTimeSubCommand,
} from './commands/message';
import { SetupMessage, SetupRequired, SetupTrusted } from './commands/setup';

import { BirthdayJob } from './jobs';
import { Bot } from './bot';
import { DataAccess } from './services/database/data-access';

let Config = require('../config/config.json');

async function start(): Promise<void> {
    Logger.info('Starting Bot!');

    let clientOptions: ClientOptions = {
        messageCacheMaxSize: Config.clientOptions.messageCacheMaxSize,
        messageCacheLifetime: Config.clientOptions.messageCacheLifetime,
        messageSweepInterval: Config.clientOptions.messageSweepInterval,
        partials: Config.clientOptions.partials as PartialTypes[],
    };

    let client = new Client(clientOptions);
    let dataAccess = new DataAccess(Config.mysql);

    let defaultHelpCommand = new DefaultHelpCommand();

    // Repos
    let guildRepo = new GuildRepo(dataAccess);
    let userRepo = new UserRepo(dataAccess);
    let customMessageRepo = new CustomMessageRepo(dataAccess);

    // Services
    let birthdayService = new BirthdayService(customMessageRepo);

    // Commands
    let setCommand = new SetCommand(userRepo);

    let createCommand = new CreateCommand(guildRepo);
    let updateCommand = new UpdateCommand(guildRepo);
    let clearCommand = new ClearCommand(guildRepo);
    let settingsCommand = new SettingsCommand(guildRepo);

    let listCommand = new ListCommand(userRepo);
    let purgeCommand = new PurgeCommand(userRepo);
    let inviteCommand = new InviteCommand();
    let supportCommand = new SupportCommand();
    let mapCommand = new MapCommand();
    let viewCommand = new ViewCommand(userRepo);
    let nextCommand = new NextCommand(userRepo);
    let trustedCommand = new TrustedCommand(guildRepo);
    let setAttemptsCommand = new SetAttemptsCommand(userRepo);

    // Setup Sub Commands
    let setupRequired = new SetupRequired(guildRepo);
    let setupMessage = new SetupMessage(guildRepo);
    let setupTrusted = new SetupTrusted(guildRepo);

    // Setup Command
    let setupCommand = new SetupCommand(guildRepo, setupRequired, setupMessage, setupTrusted);

    // Message Sub Commands
    let messageListSubCommand = new MessageListSubCommand(customMessageRepo);
    let messageClearSubCommand = new MessageClearSubCommand(customMessageRepo);
    let messageAddSubCommand = new MessageAddSubCommand(customMessageRepo);
    let messageRemoveSubCommand = new MessageRemoveSubCommand(customMessageRepo);
    let messageTimSubCommand = new MessageTimeSubCommand(guildRepo);
    let messageMentionSubCommand = new MessageMentionSubCommand(guildRepo);
    let messageEmbedSubCommand = new MessageEmbedSubCommand(guildRepo);
    let messageTestSubCommand = new MessageTestSubCommand(guildRepo, customMessageRepo);

    // Message Command
    let messageCommand = new MessageCommand(
        messageListSubCommand,
        messageClearSubCommand,
        messageAddSubCommand,
        messageRemoveSubCommand,
        messageTimSubCommand,
        messageMentionSubCommand,
        messageEmbedSubCommand,
        messageTestSubCommand
    );

    // Events handlers
    let messageHandler = new MessageHandler(
        defaultHelpCommand,
        [
            setCommand,
            setupCommand,
            createCommand,
            updateCommand,
            clearCommand,
            messageCommand,
            listCommand,
            purgeCommand,
            inviteCommand,
            supportCommand,
            mapCommand,
            viewCommand,
            nextCommand,
            trustedCommand,
            setAttemptsCommand,
            settingsCommand,
        ],
        guildRepo
    );
    let reactionAddHandler = new ReactionAddHandler(userRepo, customMessageRepo);
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();

    let birthdayJob = new BirthdayJob(client, guildRepo, userRepo, birthdayService);

    let bot = new Bot(
        Config.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        reactionAddHandler,
        messageHandler,
        birthdayJob
    );

    await bot.start();
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection.', reason);
});

start();
