import * as Chrono from 'chrono-node';

import { FormatUtils, MessageUtils, ParseUtils } from '../utils';
import { Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserDataResults } from '../models/database';
import { UserRepo } from '../services/database/repos';
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

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let page = 1;
        let date;

        let input = args.slice(2).join(' ');

        if (input) {
            page = ParseUtils.parseInt(input);

            if (!page) date = Chrono.parseDate(input); // Try an parse a date

            if (!page || page <= 0 || page > 100000) page = 1;
        }

        let pageSize = Config.experience.birthdayListSize;

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

        let embed = await FormatUtils.getBirthdayListFullEmbed(
            msg.guild,
            userDataResults,
            userDataResults.stats.Page,
            pageSize
        );

        let message = await MessageUtils.send(channel, embed);

        if (embed.description === Lang.getRef('list.noBirthdays', LangCode.EN)) return;

        await MessageUtils.react(message, Config.emotes.previousPage);
        await MessageUtils.react(message, Config.emotes.jumpToPage);
        await MessageUtils.react(message, Config.emotes.nextPage);
    }
}
