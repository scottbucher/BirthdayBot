import { DMChannel, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import { GuildUtils, MessageUtils } from '../utils';

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

    constructor(private userRepo: UserRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        let target: User;

        if (args.length === 3) {
            // Check if the user is trying to set another person's birthday
            if (channel instanceof DMChannel) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.viewUserInDm', LangCode.EN_US)
                );
                return;
            }

            // Get who they are mentioning
            target =
                msg.mentions.members.first()?.user ||
                GuildUtils.findMember(msg.guild, args[2])?.user;

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
            target = msg.author;
        }

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
        return;
    }
}
