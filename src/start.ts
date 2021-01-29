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
    DevCommand,
    DocumentationCommand,
    DonateCommand,
    FAQCommand,
    HelpCommand,
    InfoCommand,
    InviteCommand,
    ListCommand,
    MapCommand,
    MemberAnniversaryRoleCommand,
    MessageCommand,
    NextCommand,
    PurgeCommand,
    SetAttemptsCommand,
    SetCommand,
    SettingsCommand,
    SetupCommand,
    SupportCommand,
    TestCommand,
    TrustedRoleCommand,
    ViewCommand,
} from './commands';
import {
    BlacklistRepo,
    CustomMessageRepo,
    GuildRepo,
    MemberAnniversaryRoleRepo,
    UserRepo,
} from './services/database/repos';
import { ClientOptions, DiscordAPIError } from 'discord.js';
import {
    ConfigBirthdayMasterRoleSubCommand,
    ConfigChannelSubCommand,
    ConfigNameFormatSubCommand,
    ConfigRequireAllTrustedRolesSubCommand,
    ConfigRoleSubCommand,
    ConfigTimezoneSubCommand,
    ConfigTrustedPreventsMsgSubCommand,
    ConfigTrustedPreventsRoleSubCommand,
    ConfigUseTimezoneSubCommand,
} from './commands/config';
import { GuildJoinHandler, GuildLeaveHandler, MessageHandler, ReactionAddHandler } from './events';
import {
    MemberAnniversaryRoleAddSubCommand,
    MemberAnniversaryRoleClearSubCommand,
    MemberAnniversaryRoleListSubCommand,
    MemberAnniversaryRoleRemoveSubCommand,
} from './commands/memberAnniversaryRole';
import {
    MessageAddSubCommand,
    MessageClearSubCommand,
    MessageListSubCommand,
    MessageMentionSubCommand,
    MessageRemoveSubCommand,
    MessageTestSubCommand,
    MessageTimeSubCommand,
    MessageUserListSubCommand,
} from './commands/message';
import { SetupMessage, SetupRequired, SetupTrusted } from './commands/setup';
import {
    TrustedRoleAddSubCommand,
    TrustedRoleClearSubCommand,
    TrustedRoleListSubCommand,
    TrustedRoleRemoveSubCommand,
} from './commands/trusted';

import { Bot } from './bot';
import { CustomClient } from './extensions/custom-client';
import { DataAccess } from './services/database/data-access';
import { PostBirthdaysJob } from './jobs';
import { PremiumCommand } from './commands/premium-commands';
import { StatsCommand } from './commands/stats-command';
import { SubscribeCommand } from './commands/subscribe-command';
import { TrustedRoleRepo } from './services/database/repos/trusted-role-repo';

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
    let trustedRoleRepo = new TrustedRoleRepo(dataAccess);
    let memberAnniversaryRoleRepo = new MemberAnniversaryRoleRepo(dataAccess);

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
    let devCommand = new DevCommand();
    let documentationCommand = new DocumentationCommand();
    let donateCommand = new DonateCommand();
    let faqCommand = new FAQCommand();
    let infoCommand = new InfoCommand();
    let inviteCommand = new InviteCommand();
    let listCommand = new ListCommand(userRepo);
    let mapCommand = new MapCommand();
    let nextCommand = new NextCommand(userRepo);
    let premiumCommand = new PremiumCommand(subscriptionService);
    let purgeCommand = new PurgeCommand(userRepo);
    let setAttemptsCommand = new SetAttemptsCommand(userRepo);
    let setCommand = new SetCommand(guildRepo, userRepo);
    let settingsCommand = new SettingsCommand(guildRepo);
    let statsCommand = new StatsCommand(userRepo);
    let subscribeCommand = new SubscribeCommand(subscriptionService);
    let supportCommand = new SupportCommand();
    let testCommand = new TestCommand(birthdayService, guildRepo, blacklistRepo);
    let viewCommand = new ViewCommand(userRepo);

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
    let messageTestSubCommand = new MessageTestSubCommand(guildRepo, customMessageRepo);
    let messageUserListSubCommand = new MessageUserListSubCommand(customMessageRepo);

    // Message Command
    let messageCommand = new MessageCommand(
        messageListSubCommand,
        messageClearSubCommand,
        messageAddSubCommand,
        messageRemoveSubCommand,
        messageTimSubCommand,
        messageMentionSubCommand,
        messageTestSubCommand,
        messageUserListSubCommand
    );

    // Config Sub Commands
    let configChannelSubCommand = new ConfigChannelSubCommand(guildRepo);
    let configRoleSubCommand = new ConfigRoleSubCommand(guildRepo);
    let configBirthdayMasterRoleSubCommand = new ConfigBirthdayMasterRoleSubCommand(guildRepo);
    let configNameFormatSubCommand = new ConfigNameFormatSubCommand(guildRepo);
    let configTrustedPreventMsgSubCommand = new ConfigTrustedPreventsMsgSubCommand(guildRepo);
    let configTrustedPreventRoleSubCommand = new ConfigTrustedPreventsRoleSubCommand(guildRepo);
    let configTimezoneSubCommand = new ConfigTimezoneSubCommand(guildRepo);
    let configUseTimezoneSubCommand = new ConfigUseTimezoneSubCommand(guildRepo);
    let configRequireAllTrustedRolesSubCommand = new ConfigRequireAllTrustedRolesSubCommand(
        guildRepo
    );

    // Config Command
    let configCommand = new ConfigCommand(
        configBirthdayMasterRoleSubCommand,
        configChannelSubCommand,
        configRoleSubCommand,
        configNameFormatSubCommand,
        configTrustedPreventMsgSubCommand,
        configTrustedPreventRoleSubCommand,
        configTimezoneSubCommand,
        configUseTimezoneSubCommand,
        configRequireAllTrustedRolesSubCommand
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

    // Trusted Role Sub Commands
    let trustedRoleAddSubCommand = new TrustedRoleAddSubCommand(trustedRoleRepo);
    let trustedRoleRemoveSubCommand = new TrustedRoleRemoveSubCommand(trustedRoleRepo);
    let trustedRoleClearSubCommand = new TrustedRoleClearSubCommand(trustedRoleRepo);
    let trustedRoleListSubCommand = new TrustedRoleListSubCommand(trustedRoleRepo);

    // Trusted Role Command
    let trustedRoleCommand = new TrustedRoleCommand(
        trustedRoleAddSubCommand,
        trustedRoleRemoveSubCommand,
        trustedRoleClearSubCommand,
        trustedRoleListSubCommand
    );

    // Member Anniversary Role Sub Commands
    let memberAnniversaryRoleAddSubCommand = new MemberAnniversaryRoleAddSubCommand(
        memberAnniversaryRoleRepo
    );
    let memberAnniversaryRoleRemoveSubCommand = new MemberAnniversaryRoleRemoveSubCommand(
        memberAnniversaryRoleRepo
    );
    let memberAnniversaryRoleClearSubCommand = new MemberAnniversaryRoleClearSubCommand(
        memberAnniversaryRoleRepo
    );
    let memberAnniversaryRoleListSubCommand = new MemberAnniversaryRoleListSubCommand(
        memberAnniversaryRoleRepo
    );

    // Member Anniversary Role Command
    let memberAnniversaryRoleCommand = new MemberAnniversaryRoleCommand(
        memberAnniversaryRoleAddSubCommand,
        memberAnniversaryRoleRemoveSubCommand,
        memberAnniversaryRoleClearSubCommand,
        memberAnniversaryRoleListSubCommand
    );

    // Events handlers
    let messageHandler = new MessageHandler(
        helpCommand,
        [
            blacklistCommand,
            configCommand,
            devCommand,
            documentationCommand,
            donateCommand,
            faqCommand,
            infoCommand,
            inviteCommand,
            listCommand,
            mapCommand,
            memberAnniversaryRoleCommand,
            messageCommand,
            nextCommand,
            premiumCommand,
            purgeCommand,
            setAttemptsCommand,
            setCommand,
            settingsCommand,
            setupCommand,
            statsCommand,
            subscribeCommand,
            supportCommand,
            testCommand,
            trustedRoleCommand,
            viewCommand,
        ],
        subscriptionService,
        guildRepo,
        userRepo
    );
    let reactionAddHandler = new ReactionAddHandler(
        userRepo,
        customMessageRepo,
        blacklistRepo,
        trustedRoleRepo,
        subscriptionService
    );
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();

    let postBirthdaysJob = new PostBirthdaysJob(
        Config.jobs.postBirthdays.schedule,
        Config.jobs.postBirthdays.interval * 1000,
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
