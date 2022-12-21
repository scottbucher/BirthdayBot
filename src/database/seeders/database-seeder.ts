import { EntityManager, ref } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { createRequire } from 'node:module';

import { CelebrationType } from '../../enums/celebration-type.js';
import { Logger } from '../../services/index.js';
import { TimeUtils } from '../../utils/time-utils.js';
import { EventOptions } from '../entities/custom-event.js';
import {
    CustomEventData,
    GuildData,
    MemberAnniversaryRoleData,
    MessageData,
    UserData,
    VoteData,
} from '../entities/index.js';
import { MessageOptions } from '../entities/message.js';

const require = createRequire(import.meta.url);
let _Config = require('../../../config/config.json');
let Logs = require('../../../lang/logs.json');

export class DatabaseSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        Logger.info(Logs.info.databaseSeeding);
        // Guild Data
        let guildId = '660711235766976553';
        let birthdayRoleDiscordId = '716494831584804906';
        let birthdayChannelDiscordId = '709287764847493172';

        // Trusted Role Data
        let staffRole = '660746189419053057';
        let adminRole = '660715862407249941';

        // Blacklist Data
        let blacklistedUser1 = '631628660922646550'; // My Test Account
        let blacklistedUser2 = '209449444649730049'; // bluebubbee
        let blacklistedRole1 = '1053469344744603648'; // blacklistTest1
        let blacklistedRole2 = '1053469402294648952'; // blacklistTest2

        // Member Anniversary Data
        let memberAnniversaryChannel = '709287764847493172';
        let memberAnniversaryRoleYear1 = '867927527245615144';
        let memberAnniversaryRoleYear2 = '883371862418145301';
        let memberAnniversaryRoleYear3 = '867927389236248586';

        // Server Anniversary Data
        let serverAnniversaryChannel = '709287764847493172';

        // Event Data
        let eventChannel = '1053470457959026688';

        let event1Month = 12;
        let event1Day = 25;
        let event1Options: EventOptions = {
            ping: `@everyone`,
        };

        // User Data
        let user1DiscordId = '478288246858711040'; // Scott
        let user1Birthday = TimeUtils.nextOccurrenceOfMonthDay(8, 28, 'America/New_York').toFormat(
            'yyyy-MM-dd'
        );
        let user1TimeZone = 'America/New_York';

        let user2DiscordId = '212772875793334272'; // Kevin
        let user2Birthday = TimeUtils.nextOccurrenceOfMonthDay(11, 28, 'America/New_York')
            .toUTC()
            .toFormat('yyyy-MM-dd');
        let user2TimeZone = 'America/New_York';

        // Vote Data
        let botSite = 'top.gg';
        let date1 = '"2021-05-23 19:24:11"';
        let date2 = '"2021-06-20 21:33:08"';
        let date3 = '"2021-07-14 08:04:44"';
        let date4 = '"2021-08-09 12:56:23"';

        // Create Guild
        let guild = new GuildData(guildId, birthdayChannelDiscordId, birthdayRoleDiscordId);
        guild.guildSettings.timeZone = 'America/New_York';
        em.persist(guild);
        guild.trustedSystemSettings.addRoleId(staffRole);
        guild.trustedSystemSettings.addRoleId(adminRole);
        guild.blacklistSettings.addUserId(blacklistedUser1);
        guild.blacklistSettings.addUserId(blacklistedUser2);
        guild.blacklistSettings.addRoleId(blacklistedRole1);
        guild.blacklistSettings.addRoleId(blacklistedRole2);
        guild.memberAnniversarySettings.channelDiscordId = memberAnniversaryChannel;

        // Add member anniversary roles
        let anniversaryRole1 = new MemberAnniversaryRoleData(memberAnniversaryRoleYear1, 1);
        guild.memberAnniversaryRoles.add(anniversaryRole1);
        let anniversaryRole2 = new MemberAnniversaryRoleData(memberAnniversaryRoleYear2, 2);
        guild.memberAnniversaryRoles.add(anniversaryRole2);
        let anniversaryRole3 = new MemberAnniversaryRoleData(memberAnniversaryRoleYear3, 3);
        guild.memberAnniversaryRoles.add(anniversaryRole3);

        guild.serverAnniversarySettings.channelDiscordId = serverAnniversaryChannel;
        guild.eventSettings.channelDiscordId = eventChannel;

        // Create messages
        let message1Description = 'Happy Birthday {User}!';
        let message1Options: MessageOptions = {
            title: 'Happy Birthday!',
            footer: 'This birthday message was sent automatically by the Birthday Bot.',
            color: '#f54293',
            image: 'https://tinyurl.com/44vdkj76',
        };
        let message1 = new MessageData(message1Description, message1Options);
        guild.messages.add(message1);

        let message2Description = '{Users} is celebrating {Year}(s) of being the server!';
        let message2Options: MessageOptions = {
            type: CelebrationType.MEMBER_ANNIVERSARY,
            title: 'Happy Anniversary!',
            footer: 'This anniversary message was sent automatically by the Birthday Bot.',
            color: '#f54293',
            image: 'https://tinyurl.com/44vdkj76',
        };
        let message2 = new MessageData(message2Description, message2Options);
        guild.messages.add(message2);

        let message3Description = '{Server} is now {Year}(s) old!';
        let message3Options: MessageOptions = {
            type: CelebrationType.SERVER_ANNIVERSARY,
        };
        let message3 = new MessageData(message3Description, message3Options);
        guild.messages.add(message3);

        let message4Description = 'Merry Christmas {Server}!';
        let message4Options: MessageOptions = {
            type: CelebrationType.EVENT,
        };
        let message4 = new MessageData(message4Description, message4Options);
        guild.messages.add(message4);

        // Create events
        let event1 = new CustomEventData(event1Month, event1Day, event1Options);
        event1.message = ref(message4);
        guild.events.add(event1);

        // New Users
        em.persist([
            new UserData(user1DiscordId, user1Birthday, user1TimeZone),
            new UserData(user2DiscordId, user2Birthday, user2TimeZone),
        ]);

        // New Votes
        em.persist([
            new VoteData(botSite, user1DiscordId, date1),
            new VoteData(botSite, user2DiscordId, date2),
            new VoteData(botSite, user1DiscordId, date3),
            new VoteData(botSite, user2DiscordId, date4),
        ]);

        await em.flush();

        Logger.info(Logs.info.databaseSeeded);
    }
}
