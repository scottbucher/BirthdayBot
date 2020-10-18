import { Message, MessageEmbed, TextChannel, User } from 'discord.js';
import moment from 'moment';

import { UserData } from '../models/database';
import { BirthdayService } from '../services';
import { BlacklistRepo, GuildRepo } from '../services/database/repos';
import { GuildUtils, MessageUtils } from '../utils';
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
    public requirePremium = false;
    public getPremium = false;

    constructor(
        private birthdayService: BirthdayService,
        private guildRepo: GuildRepo,
        private blacklistRepo: BlacklistRepo
    ) {}

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
                await MessageUtils.send(channel, embed);
                return;
            }
        } else {
            // They didn't mention anyone
            target = msg.client.user;
        }

        // Get the blacklist data for this guild
        let blacklistData = await this.blacklistRepo.getBlacklist(guild.id);

        if (blacklistData.blacklist.map(data => data.UserDiscordId).includes(target.id)) {
            let testingEmbed = new MessageEmbed()
                .setThumbnail(guild.iconURL())
                .setTitle('Birthday Event Test - [BETA]')
                .setDescription(
                    'Below are the checks to ensure your settings are correct for the birthday event.\n\nIf the checks are passed and either the birthday message and/or birthday role were not given ' +
                        `when they should have then ${guild.client.user.toString()} most likely did not have the correct permissions. [(?)](${
                            Config.links.docs
                        }/faq)\n\nFor more help: [Join Support Server](${Config.links.support})`
                )
                .setFooter(
                    'This is the info from your latest birthday event test.',
                    guild.client.user.avatarURL()
                )
                .setTimestamp()
                .setColor(Config.colors.default)
                .addField(
                    'Birthday Blacklist',
                    `${Config.emotes.deny} Member is in the blacklist.`,
                    true
                );
            await channel.send(testingEmbed);
            return;
        }

        // Mock user data for bot
        let userData: UserData = {
            Birthday: moment().toDate().toString(),
            ChangesLeft: 5,
            TimeZone: MOCK_TIME_ZONE,
            UserDiscordId: target.id,
        };

        this.birthdayService.celebrateBirthdays(
            guild,
            guildData,
            [userData],
            guild.members.cache,
            true,
            channel
        );
    }
}
