import { CelebrationUtils, FormatUtils, MessageUtils } from '../utils';
import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo } from '../services/database/repos';
import moment, { Moment } from 'moment';

let Config = require('../../config/config.json');

export class NextCommand implements Command {
    public name: string = 'next';
    public aliases = ['upcoming'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = true;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {

        let type: string;

        if (args.length > 2) {
            type = FormatUtils.extractCelebrationType(args[2].toLowerCase())?.toLowerCase() ?? '';
            if (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniersary') {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidNextArgs', LangCode.EN_US)
                );
                return;
            }
        }

        if (args.length === 2 || type === 'birthday') {
            // Next birthday
            let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

            let userDatas = await this.userRepo.getAllUsers(users);

            if (!userDatas) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noBirthdaysInServer', LangCode.EN_US)
                );
                return;
            }

            let commandUser = userDatas.find(user => user.UserDiscordId === msg.author.id);

            let nextBirthdayUsers = CelebrationUtils.getNextUsers(userDatas, commandUser?.TimeZone);

            if (!nextBirthdayUsers) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUpcomingBirthdays', LangCode.EN_US)
                );
                return;
            }

            let userList = nextBirthdayUsers.map(user => msg.guild.members.resolve(user.UserDiscordId));

            let userStringList = FormatUtils.joinWithAnd(userList.map(user => user.toString()));
            let nextBirthday = moment(nextBirthdayUsers[0].Birthday).format('MMMM Do');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.nextBirthday', LangCode.EN_US, {
                    USERS: userStringList,
                    BIRTHDAY: nextBirthday,
                })
            );
        } else {

            if (type === 'memberanniversary') {
                // TODO: fetch members?
                // Next member anniversary
                let guildMembers = msg.guild.members.cache.filter(member => !member.user.bot).map(member => member);
                let closestMemberAnniversary = moment('01-01-2000');

                for (let member of guildMembers) {
                    let memberAnniversary = moment(member.joinedAt);
                    if (memberAnniversary.fromNow() < closestMemberAnniversary.fromNow())
                        closestMemberAnniversary = memberAnniversary;
                }
                let anniversaryDate = closestMemberAnniversary.format('MM-DD');

                guildMembers = guildMembers.filter(member => moment(member.joinedAt).format('MM-DD') === anniversaryDate);

                let userList = FormatUtils.joinWithAnd(guildMembers.map(member => member.toString()));


                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.nextMemberAnniversary', LangCode.EN_US, {
                        USERS: userList,
                        DATE: closestMemberAnniversary.format('MMMM Do')
                    })
                );


            } else {
                // Next server anniversary
                let serverCreatedAt = moment(msg.guild.createdAt);
                let anniversaryFormatted = serverCreatedAt.format('MMMM Do');
                let yearsOldRoundedUp = moment().year() - serverCreatedAt.year();


                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.nextServerAnniversary', LangCode.EN_US, {
                        SERVER: msg.guild.name,
                        DATE: anniversaryFormatted,
                        YEAR: yearsOldRoundedUp.toString()
                    })
                );

            }
        }
    }
}
