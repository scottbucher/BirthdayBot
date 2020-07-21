import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import moment from 'moment';

import { UserData } from '../models/database';
import { BirthdayService } from '../services';
import { GuildRepo } from '../services/database/repos';
import { Command } from './command';

let Config = require('../../config/config.json');

const MOCK_TIME_ZONE: string = 'America/New_York';

export class TestCommand implements Command {
    public name: string = 'test';
    public aliases = ['tst'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;

    constructor(private birthdayService: BirthdayService, private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
        let guild = msg.guild;

        let guildData = await this.guildRepo.getGuild(msg.guild.id);
        // Don't set a role for testing
        guildData.BirthdayRoleDiscordId = null;
        // Mock message time to current hour
        guildData.MessageTime = moment().tz(MOCK_TIME_ZONE).hour();

        // Mock user data for bot
        let userData: UserData = {
            Birthday: moment().toDate().toString(),
            ChangesLeft: 5,
            TimeZone: MOCK_TIME_ZONE,
            UserDiscordId: msg.client.user.id,
        };

        this.birthdayService.celebrateBirthdays(guild, guildData, [userData], guild.members.cache);

        let embed = new MessageEmbed()
            .setTitle('Test Birthday Message')
            .setDescription(
                `A test birthday message was sent to the <#${guildData.BirthdayChannelDiscordId}> channel!\n\nIf you do not see a birthday message posted, please check that <@${msg.client.user.id}> has all required permissions in the birthday channel.\n\n[Join Support Server](https://discord.gg/9gUQFtz)`
            )
            .setColor(Config.colors.default);
        await channel.send(embed);
    }
}
