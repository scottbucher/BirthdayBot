import { Message, MessageEmbed, TextChannel, User } from 'discord.js';

import { BirthdayService } from '../services';
import { Command } from './command';
import { GuildRepo } from '../services/database/repos';
import { GuildUtils } from '../utils';
import { UserData } from '../models/database';
import moment from 'moment';

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

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let guild = msg.guild;

        let guildData = await this.guildRepo.getGuild(msg.guild.id);
        // Mock message time to current hour
        guildData.MessageTime = moment().tz(MOCK_TIME_ZONE).hour();

        let target: User;

        if (args.length === 3) {
            // Get who they are mentioning
            target =
                msg.mentions.members.first()?.user ||
                GuildUtils.findMember(msg.guild, args[2])?.user;

            // Did we find a user?
            if (!target) {
                let embed = new MessageEmbed()
                    .setDescription('Could not find that user!')
                    .setColor(Config.colors.error);
                await channel.send(embed);
                return;
            }
        } else {
            // They didn't mention anyone
            target = msg.client.user;
        }

        // Mock user data for bot
        let userData: UserData = {
            Birthday: moment().toDate().toString(),
            ChangesLeft: 5,
            TimeZone: MOCK_TIME_ZONE,
            UserDiscordId: target.id,
        };

        this.birthdayService.celebrateBirthdays(guild, guildData, [userData], guild.members.cache, true, channel);
    }
}
