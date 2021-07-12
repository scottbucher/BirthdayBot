import { DMChannel, GuildMember, Message, TextChannel, User } from 'discord.js';
import { FormatUtils, GuildUtils, MessageUtils } from '../utils';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo } from '../services/database/repos';
import moment from 'moment';

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

    constructor(private userRepo: UserRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let type: string;
        let foundType = false;
        let foundTarget = false;

        if (args.length > 2) {
            type = FormatUtils.extractCelebrationType(args[2].toLowerCase())?.toLowerCase() ?? '';
            if (type === 'birthday' || type === 'memberanniversary') foundType = true;
        }

        type = !type ? 'birthday' : type;

        let checkArg = foundType ? 4 : 3;

        let target: User;

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
            target = (
                msg.mentions.members.first() || GuildUtils.findMember(msg.guild, args[checkArg - 1])
            )?.user;

            // Did we find a user?
            if (target) foundTarget = true;
        } else {
            // They didn't mention anyone
            target = msg.author;
        }

        if (!foundTarget && !foundType && args.length > 2) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidViewArgs', LangCode.EN_US)
            );
            return;
        }

        if (type === 'birthday') {
            let userData = await this.userRepo.getUser(target.id);

            if (!userData || !userData.Birthday || !userData.TimeZone) {
                target === msg.author
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

            msg.author === target
                ? await MessageUtils.send(
                      channel,
                      Lang.getEmbed('results.viewBirthday', LangCode.EN_US, {
                          BIRTHDAY: moment(userData.Birthday).format('MMMM Do'),
                          TIMEZONE: userData.TimeZone,
                          CHANGES_LEFT: userData.ChangesLeft.toString(),
                          ICON: msg.client.user.avatarURL(),
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
            let guildMember = msg.guild.members.resolve(target.id);
            let memberAnniversary = moment(guildMember.joinedAt).format('MMMM Do');

            msg.author === target
                ? await MessageUtils.send(
                      channel,
                      Lang.getEmbed('results.viewMemberAnniversary', LangCode.EN_US, {
                          DATE: memberAnniversary,
                      })
                  )
                : await MessageUtils.send(
                      channel,
                      Lang.getEmbed('results.viewUserMemberAnniversary', LangCode.EN_US, {
                          USER: target.toString(),
                          DATE: memberAnniversary,
                      })
                  );
        }
    }
}
