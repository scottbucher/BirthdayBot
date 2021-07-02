import { GuildUtils, MathUtils, MessageUtils, ParseUtils } from '../utils';
import { Message, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo } from '../services/database/repos';

export class SetAttemptsCommand implements Command {
    public name: string = 'setattempts';
    public aliases = ['setchangesleft'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = true;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let target: User;

        if (args.length < 3) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noUserSpecified', LangCode.EN_US)
            );
            return;
        }
        // Get who they are mentioning
        target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[2])?.user;

        // Did we find a user?
        if (!target) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noUserFound', LangCode.EN_US)
            );
            return;
        }

        if (args.length < 4) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noAmountGiven', LangCode.EN_US)
            );
            return;
        }

        let amount = MathUtils.clamp(ParseUtils.parseInt(args[3]), 0, 127);

        if (!(typeof amount === 'number') || !amount) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidNumber', LangCode.EN_US)
            );
            return;
        }

        if (amount > 127) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.amountTooLarge', LangCode.EN_US)
            );
            return;
        }

        let userData = await this.userRepo.getUser(target.id);

        if (!userData) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.attemptsLeft', LangCode.EN_US)
            );
            return;
        }

        await this.userRepo.addOrUpdateUser(
            target.id,
            userData.Birthday,
            userData.TimeZone,
            amount
        );

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.setAttempts', LangCode.EN_US, {
                USER: target.toString(),
                AMOUNT: amount.toString(),
            })
        );
        return;
    }
}
