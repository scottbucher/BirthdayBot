import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { createRequire } from 'node:module';

import { MessageType } from '../../enums/message-type.js';
import { Logger } from '../../services/index.js';
import { EventOptions } from '../entities/event.js';
import { MemberAnniversaryRoleData } from '../entities/guild.js';
import { EventData, GuildData, MessageData, UserData } from '../entities/index.js';
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
            mention: `@everyone`,
        };

        // User Data
        let user1DiscordId = '478288246858711040'; // Scott
        let user1Birthday = '08-28';
        let user1TimeZone = 'America/New_York';

        let user2DiscordId = '212772875793334272'; // Kevin
        let user2Birthday = '11-28';
        let user2TimeZone = 'America/New_York';

        // Message Data
        let message1Description = 'Happy Birthday {User}!';
        let message1Options: MessageOptions = {
            title: 'Happy Birthday!',
            footer: 'This birthday message was sent automatically by the Birthday Bot.',
            color: '#f54293',
            image: 'https://tinyurl.com/44vdkj76',
        };

        let message2Description = '{Users} is celebrating {Year}(s) of being the server!';
        let message2Options: MessageOptions = {
            type: MessageType.MEMBER_ANNIVERSARY,
            title: 'Happy Anniversary!',
            footer: 'This anniversary message was sent automatically by the Birthday Bot.',
            color: '#f54293',
            image: 'https://tinyurl.com/44vdkj76',
        };

        let message3Description = '{Server} is now {Year}(s) old!';
        let message3Options: MessageOptions = {
            type: MessageType.SERVER_ANNIVERSARY,
        };

        let message4Description = 'Merry Christmas {Server}!';
        let message4Options: MessageOptions = {
            type: MessageType.EVENT,
        };

        let guild = new GuildData(guildId, birthdayChannelDiscordId, birthdayRoleDiscordId);

        guild.trustedSystemSettings.roleIds.concat([staffRole, adminRole]);

        guild.blacklistSettings.userIds.concat([blacklistedUser1, blacklistedUser2]);
        guild.blacklistSettings.roleIds.concat([blacklistedRole1, blacklistedRole2]);

        guild.memberAnniversarySettings.channelDiscordId = memberAnniversaryChannel;
        guild.memberAnniversarySettings.memberAnniversaryRoles.push(
            new MemberAnniversaryRoleData(1, memberAnniversaryRoleYear1),
            new MemberAnniversaryRoleData(2, memberAnniversaryRoleYear2),
            new MemberAnniversaryRoleData(3, memberAnniversaryRoleYear3)
        );

        let event1 = new EventData(event1Month, event1Day, event1Options);
        let message4 = new MessageData(message4Description, message4Options);
        event1.message.set(message4);

        guild.events.add(event1);

        guild.serverAnniversarySettings.channelDiscordId = serverAnniversaryChannel;
        guild.eventSettings.channelDiscordId = eventChannel;

        guild.messages.add([
            new MessageData(message1Description, message1Options),
            new MessageData(message2Description, message2Options),
            new MessageData(message3Description, message3Options),
            new MessageData(message4Description, message4Options),
        ]);

        em.persist(guild);

        // New Users
        em.persist(new UserData(user1DiscordId, user1Birthday, user1TimeZone));
        em.persist(new UserData(user2DiscordId, user2Birthday, user2TimeZone));

        await em.flush();

        Logger.info(Logs.info.databaseSeeded);
    }
}
