import { BirthdayService, HttpService, Logger, SubscriptionService } from './services';
import {
    BlacklistAddSubCommand,
    BlacklistClearSubCommand,
    BlacklistListSubCommand,
    BlacklistRemoveSubCommand,
} from './commands/blacklist';
import {
    BlacklistCommand,
    ConfigCommand,
    DocumentationCommand,
    DonateCommand,
    FAQCommand,
    HelpCommand,
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
    TestCommand,
    ViewCommand,
} from './commands';
import { BlacklistRepo, CustomMessageRepo, GuildRepo, UserRepo } from './services/database/repos';
import { ClientOptions, DiscordAPIError } from 'discord.js';
import {
    ConfigBirthdayMasterRoleSubCommand,
    ConfigChannelSubCommand,
    ConfigNameFormatSubCommand,
    ConfigRoleSubCommand,
    ConfigTrustedPreventsMsgSubCommand,
    ConfigTrustedPreventsRoleSubCommand,
    ConfigTrustedRoleSubCommand,
} from './commands/config';
import { GuildJoinHandler, GuildLeaveHandler, MessageHandler, ReactionAddHandler } from './events';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageColorSubCommand,
    MessageEmbedSubCommand,
    MessageListSubCommand,
    MessageMentionSubCommand,
    MessageRemoveSubCommand,
    MessageTestSubCommand,
    MessageTimeSubCommand,
    MessageUserListSubCommand,
} from './commands/message';
import { SetupMessage, SetupRequired, SetupTrusted } from './commands/setup';

import { Bot } from './bot';
import { CustomClient } from './extensions/custom-client';
import { DataAccess } from './services/database/data-access';
import { PostBirthdaysJob } from './jobs';
import { PremiumCommand } from './commands/premium-commands';
import { StatsCommand } from './commands/stats-command';
import { SubscribeCommand } from './commands/subscribe-command';

let Config = require('../config/config.json');

async function start(): Promise<void> {
    Logger.info('Starting Bot!');
    let dataAccess = new DataAccess(Config.mysql);
    let httpService = new HttpService();

    // Repos
    let guildRepo = new GuildRepo(dataAccess);
    let userRepo = new UserRepo(dataAccess);
    let customMessageRepo = new CustomMessageRepo(dataAccess);
    let blacklistRepo = new BlacklistRepo(dataAccess);

    let clientOptions: ClientOptions = {
        ws: { intents: Config.client.intents },
        partials: Config.client.partials,
        messageCacheMaxSize: Config.client.caches.messages.size,
        messageCacheLifetime: Config.client.caches.messages.lifetime,
        messageSweepInterval: Config.client.caches.messages.sweepInterval,
    };

    let client = new CustomClient(clientOptions, guildRepo);

    let helpCommand = new HelpCommand();

    // Services
    let subscriptionService = new SubscriptionService(httpService);
    let birthdayService = new BirthdayService(customMessageRepo, subscriptionService);

    // Commands
    let setCommand = new SetCommand(guildRepo, userRepo);
    let statsCommand = new StatsCommand(userRepo);

    let settingsCommand = new SettingsCommand(guildRepo);

    let listCommand = new ListCommand(userRepo);
    let purgeCommand = new PurgeCommand(userRepo);
    let inviteCommand = new InviteCommand();
    let supportCommand = new SupportCommand();
    let mapCommand = new MapCommand();
    let viewCommand = new ViewCommand(userRepo);
    let nextCommand = new NextCommand(userRepo);
    let setAttemptsCommand = new SetAttemptsCommand(userRepo);
    let testCommand = new TestCommand(birthdayService, guildRepo, blacklistRepo);
    let faqCommand = new FAQCommand();
    let documentationCommand = new DocumentationCommand();
    let donateCommand = new DonateCommand();
    let premiumCommand = new PremiumCommand(subscriptionService);
    let subscribeCommand = new SubscribeCommand(subscriptionService);

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
    let messageColorSubCommand = new MessageColorSubCommand(guildRepo);
    let messageUserListSubCommand = new MessageUserListSubCommand(customMessageRepo);

    // Message Command
    let messageCommand = new MessageCommand(
        messageListSubCommand,
        messageClearSubCommand,
        messageAddSubCommand,
        messageRemoveSubCommand,
        messageTimSubCommand,
        messageMentionSubCommand,
        messageEmbedSubCommand,
        messageTestSubCommand,
        messageColorSubCommand,
        messageUserListSubCommand
    );

    // Config Sub Commands
    let configChannelSubCommand = new ConfigChannelSubCommand(guildRepo);
    let configRoleSubCommand = new ConfigRoleSubCommand(guildRepo);
    let configBirthdayMasterRoleSubCommand = new ConfigBirthdayMasterRoleSubCommand(guildRepo);
    let configNameFormatSubCommand = new ConfigNameFormatSubCommand(guildRepo);
    let configTrustedRoleSubCommand = new ConfigTrustedRoleSubCommand(guildRepo);
    let configTrustedPreventMsgSubCommand = new ConfigTrustedPreventsMsgSubCommand(guildRepo);
    let configTrustedPreventRoleSubCommand = new ConfigTrustedPreventsRoleSubCommand(guildRepo);

    // Config Command
    let configCommand = new ConfigCommand(
        configBirthdayMasterRoleSubCommand,
        configChannelSubCommand,
        configRoleSubCommand,
        configNameFormatSubCommand,
        configTrustedRoleSubCommand,
        configTrustedPreventMsgSubCommand,
        configTrustedPreventRoleSubCommand
    );

    // Blacklist Sub Commands
    let blacklistAddSubCommand = new BlacklistAddSubCommand(blacklistRepo);
    let blacklistRemoveSubCommand = new BlacklistRemoveSubCommand(blacklistRepo);
    let blacklistClearSubCommand = new BlacklistClearSubCommand(blacklistRepo);
    let blacklistListSubCommand = new BlacklistListSubCommand(blacklistRepo);

    // Blacklist Command
    let blacklistCommand = new BlacklistCommand(
        blacklistAddSubCommand,
        blacklistRemoveSubCommand,
        blacklistClearSubCommand,
        blacklistListSubCommand
    );

    // Events handlers
    let messageHandler = new MessageHandler(
        helpCommand,
        [
            setCommand,
            setupCommand,
            messageCommand,
            listCommand,
            purgeCommand,
            inviteCommand,
            supportCommand,
            mapCommand,
            viewCommand,
            nextCommand,
            setAttemptsCommand,
            settingsCommand,
            testCommand,
            statsCommand,
            faqCommand,
            documentationCommand,
            donateCommand,
            blacklistCommand,
            premiumCommand,
            subscribeCommand,
            configCommand,
        ],
        subscriptionService,
        guildRepo,
        userRepo
    );
    let reactionAddHandler = new ReactionAddHandler(
        userRepo,
        customMessageRepo,
        blacklistRepo,
        subscriptionService
    );
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();

    let postBirthdaysJob = new PostBirthdaysJob(
        Config.jobs.postBirthdays.schedule,
        client,
        guildRepo,
        userRepo,
        blacklistRepo,
        birthdayService
    );

    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        reactionAddHandler,
        messageHandler,
        [postBirthdaysJob]
    );

    await bot.start();
}

process.on('unhandledRejection', (reason, promise) => {
    if (reason instanceof DiscordAPIError) {
        if (reason.code === 10003) return;
    }
    Logger.error('Unhandled promise rejection.', reason);
});

start();
