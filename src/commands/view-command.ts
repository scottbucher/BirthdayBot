import { DMChannel, Message, MessageEmbed, TextChannel, User, GuildMember } from 'discord.js';
import { GuildUtils, MessageUtils, FormatUtils } from '../utils';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

let Config = require('../../config/config.json');

export class ViewCommand implements Command {
    public name: string = 'view';
    public aliases = ['see'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) { }

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {


        let type: string;
        let foundType = false;

        if (args.length > 2) {
            type = FormatUtils.extractCelebrationType(args[2].toLowerCase())?.toLowerCase() ?? '';
            if (type !== 'birthday' && type !== 'memberanniversary') {
                // Lang part not implemented
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidBirthdayListArgs', LangCode.EN_US)
                );
                return;
            } else if (type === 'memberanniversary' && channel instanceof DMChannel) {
                // Can't check an anniversary in a DM channel
                return;
            }
            foundType = true;
        } else {
            type = 'birthday'
        }

        let checkArg = foundType ? 4 : 3;

        let target: GuildMember;

        if (args.length === checkArg) {
            // Check if the user is trying to view another person's birthday
            if (channel instanceof DMChannel) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.viewUserInDm', LangCode.EN_US)
                );
                return;
            }

            // Get who they are mentioning
            target =
                msg.mentions.members.first() ||
                GuildUtils.findMember(msg.guild, args[checkArg - 1])

            // Did we find a user?
            if (!target) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUserFound', LangCode.EN_US)
                );
                return;
            }
        } else {
            // They didn't mention anyone
            target = msg.member;
        }

        if (type === 'birthday') {
            let userData = await this.userRepo.getUser(target.id);

            if (!userData || !userData.Birthday || !userData.TimeZone) {
                target === msg.member
                    ? await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.birthdayNotSet', LangCode.EN_US)
                    )
                    : await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.userBirthdayNotSet', LangCode.EN_US, {
                            USER: target.toString(),
                        })
                    );
                return;
            }

            msg.member === target
                ? await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.viewBirthday', LangCode.EN_US, {
                        BIRTHDAY: moment(userData.Birthday).format('MMMM Do'),
                        TIMEZONE: userData.TimeZone,
                        CHANGES_LEFT: userData.ChangesLeft.toString(),
                    })
                )
                : await MessageUtils.send(
                    channel,
                    Lang.getEmbed('results.viewUserBirthday', LangCode.EN_US, {
                        USER: target.toString(),
                        BIRTHDAY: moment(userData.Birthday).format('MMMM Do'),
                        TIMEZONE: userData.TimeZone,
                    })
                );
        } else if (type === 'memberanniversary') {
            let memberAnniversary = moment(target.joinedAt).format('MMMM Do');

            // send the message
        }
    }
}
