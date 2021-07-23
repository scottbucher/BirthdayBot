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
    FaqCommand,
    HelpCommand,
    InfoCommand,
    InviteCommand,
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
    StatsCommand,
    SubscribeCommand,
    SupportCommand,
    TestCommand,
    TrustedRoleCommand,
    UpdateCommand,
    ViewCommand,
    VoteCommand,
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
import { ClientOptions, DiscordAPIError } from 'discord.js';
import {
    ConfigBirthdayMasterRoleSubCommand,
    ConfigChannelSubCommand,
    ConfigDateFormatSubCommand,
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
    CelebrationService,
    HttpService,
    JobService,
    Logger,
    SubscriptionService,
} from './services';
import {
    MemberAnniversaryRoleAddSubCommand,
    MemberAnniversaryRoleClaimSubCommand,
    MemberAnniversaryRoleClearSubCommand,
    MemberAnniversaryRoleListSubCommand,
    MemberAnniversaryRoleRemoveSubCommand,
} from './commands/memberAnniversaryRole';
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
} from './commands/message';
import { SetupAnniversary, SetupRequired, SetupTrusted } from './commands/setup';
import {
    TrustedRoleAddSubCommand,
    TrustedRoleClearSubCommand,
    TrustedRoleListSubCommand,
    TrustedRoleRemoveSubCommand,
} from './commands/trusted';

import { Bot } from './bot';
import { CelebrationJob } from './jobs';
import { CustomClient } from './extensions/custom-client';
import { DataAccess } from './services/database/data-access';

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
    let combinedRepo = new CombinedRepo(dataAccess);

    let clientOptions: ClientOptions = {
        ws: { intents: Config.client.intents },
        partials: Config.client.partials,
        fetchAllMembers: true,
        messageCacheMaxSize: Config.client.caches.messages.size,
        messageCacheLifetime: Config.client.caches.messages.lifetime,
        messageSweepInterval: Config.client.caches.messages.sweepInterval,
    };

    let client = new CustomClient(clientOptions, guildRepo);

    let helpCommand = new HelpCommand();

    // Services
    let subscriptionService = new SubscriptionService(httpService);
    let celebrationService = new CelebrationService();

    // Commands
    let devCommand = new DevCommand();
    let documentationCommand = new DocumentationCommand();
    let donateCommand = new DonateCommand();
    let faqCommand = new FaqCommand();
    let infoCommand = new InfoCommand();
    let inviteCommand = new InviteCommand();
    let listCommand = new ListCommand(userRepo, guildRepo);
    let mapCommand = new MapCommand();
    let nextCommand = new NextCommand(userRepo, guildRepo);
    let premiumCommand = new PremiumCommand(subscriptionService);
    let purgeCommand = new PurgeCommand(userRepo);
    let setAttemptsCommand = new SetAttemptsCommand(userRepo);
    let setCommand = new SetCommand(guildRepo, userRepo);
    let settingsCommand = new SettingsCommand(guildRepo, trustedRoleRepo);
    let statsCommand = new StatsCommand(userRepo);
    let subscribeCommand = new SubscribeCommand(subscriptionService);
    let supportCommand = new SupportCommand();
    let testCommand = new TestCommand(
        guildRepo,
        userRepo,
        customMessageRepo,
        trustedRoleRepo,
        blacklistRepo,
        memberAnniversaryRoleRepo
    );
    let viewCommand = new ViewCommand(userRepo);
    let voteCommand = new VoteCommand();
    let updateCommand = new UpdateCommand();

    // Setup Sub Commands
    let setupRequired = new SetupRequired(guildRepo);
    let setupTrusted = new SetupTrusted(guildRepo);
    let setupAnniversary = new SetupAnniversary(guildRepo);

    // Setup Command
    let setupCommand = new SetupCommand(guildRepo, setupRequired, setupTrusted, setupAnniversary);

    // Message Sub Commands
    let messageListSubCommand = new MessageListSubCommand(customMessageRepo);
    let messageClearSubCommand = new MessageClearSubCommand(customMessageRepo);
    let messageAddSubCommand = new MessageAddSubCommand(customMessageRepo);
    let messageRemoveSubCommand = new MessageRemoveSubCommand(customMessageRepo);
    let messageTimSubCommand = new MessageTimeSubCommand(guildRepo);
    let messageMentionSubCommand = new MessageMentionSubCommand(guildRepo);
    let messageTestSubCommand = new MessageTestSubCommand(guildRepo, customMessageRepo);
    let messageEmbedSubCommand = new MessageEmbedSubCommand(customMessageRepo);
    let messageColorSubCommand = new MessageColorSubCommand(customMessageRepo);

    // Message Command
    let messageCommand = new MessageCommand(
        messageListSubCommand,
        messageClearSubCommand,
        messageAddSubCommand,
        messageRemoveSubCommand,
        messageTimSubCommand,
        messageMentionSubCommand,
        messageTestSubCommand,
        messageEmbedSubCommand,
        messageColorSubCommand
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
    let configDateFormatSubCommand = new ConfigDateFormatSubCommand(guildRepo);

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
        configRequireAllTrustedRolesSubCommand,
        configDateFormatSubCommand
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
    let memberAnniversaryRoleClaimSubCommand = new MemberAnniversaryRoleClaimSubCommand(
        memberAnniversaryRoleRepo
    );

    // Member Anniversary Role Command
    let memberAnniversaryRoleCommand = new MemberAnniversaryRoleCommand(
        guildRepo,
        memberAnniversaryRoleAddSubCommand,
        memberAnniversaryRoleRemoveSubCommand,
        memberAnniversaryRoleClearSubCommand,
        memberAnniversaryRoleListSubCommand,
        memberAnniversaryRoleClaimSubCommand
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
            trustedRoleCommand,
            viewCommand,
            voteCommand,
            testCommand,
            updateCommand,
        ],
        subscriptionService,
        guildRepo,
        userRepo
    );
    let reactionAddHandler = new ReactionAddHandler(
        userRepo,
        guildRepo,
        customMessageRepo,
        blacklistRepo,
        trustedRoleRepo,
        subscriptionService
    );
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();

    let jobService = new JobService([
        new CelebrationJob(client, userRepo, combinedRepo, celebrationService, subscriptionService),
    ]);

    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        reactionAddHandler,
        messageHandler,
        jobService
    );

    await bot.start();
}

process.on('unhandledRejection', (reason, promise) => {
    // 10003: "Unknown channel"
    if (reason instanceof DiscordAPIError && reason.code === 10003) {
        return;
    }

    Logger.error('Unhandled promise rejection.', reason);
});

start();
