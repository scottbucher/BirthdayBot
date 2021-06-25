import * as Chrono from 'chrono-node';

import { FormatUtils, MessageUtils, ParseUtils } from '../utils';
import { Message, TextChannel, MessageEmbed } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserDataResults } from '../models/database';
import { UserRepo, GuildRepo } from '../services/database/repos';
import moment from 'moment';

let Config = require('../../config/config.json');

export class ListCommand implements Command {
    public name: string = 'list';
    public aliases = ['viewall'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = true;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo, private guildRepo: GuildRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let guildData = await this.guildRepo.getGuild(msg.guild.id);

        let type: string;

        if (args.length > 2) {
            type = FormatUtils.extractCelebrationType(args[2].toLowerCase())?.toLowerCase() ?? '';
            if (type !== 'birthday' && type !== 'memberanniversary') {
                // Lang part not implemented
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidBirthdayListArgs', LangCode.EN_US)
                );
                return;
            }
        } else {
            type = 'birthday'
        }

        let page = 1;
        let date: moment.MomentInput;

        let input = args.length > 3 ? args.slice(3).join(' ') : args.slice(2).join(' ');

        if (input) {
            page = ParseUtils.parseInt(input);

            if (!page) date = Chrono.parseDate(input); // Try an parse a date

            if (!page || page <= 0 || page > 100000) page = 1;
        }

        // TODO: Add config option for the size of the memberAnniversaryList
        let pageSize = type === 'birthday' ? Config.experience.birthdayListSize : Config.experience.birthdayListSize;

        let embed: MessageEmbed;

        if (type === 'birthday') {
            // Birthday List
            let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

            let userDataResults: UserDataResults;

            if (date) {
                let input = moment(date).format('MM-DD');
                userDataResults = await this.userRepo.getBirthdayListFullFromDate(
                    users,
                    pageSize,
                    input
                );
            } else {
                userDataResults = await this.userRepo.getBirthdayListFull(users, pageSize, page);
            }

            embed = await FormatUtils.getBirthdayListFullEmbed(
                msg.guild,
                userDataResults,
                guildData,
                userDataResults.stats.Page,
                pageSize
            );
        } else {
            // Member Anniversary List
            let guildMembers = msg.guild.members.cache.filter(member => !member.user.bot).map(member => member);

            let totalMembers = guildMembers.length;

            guildMembers = guildMembers.sort((first, second) => 0 - (moment(first.joinedAt).format('MM-DD') > moment(second.joinedAt).format('MM-DD') ? -1 : 1));

            let totalPages = Math.ceil(guildMembers.length / pageSize);

            let startMember: number;

            if (date) {
                startMember = guildMembers.indexOf(guildMembers.find(m => moment(m.joinedAt).format('MM') === moment(date).format('MM')));
            } else {
                startMember = (pageSize * page) - 1;
            }

            guildMembers.slice(startMember, startMember + pageSize);

            embed = await FormatUtils.getMemberAnniversaryListFullEmbed(
                msg.guild,
                guildMembers,
                guildData,
                page,
                pageSize,
                totalPages,
                totalMembers
            );


        }

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === Lang.getRef('list.noBirthdays', LangCode.EN_US)) return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
