import { ApplicationCommandData, CommandInteraction, PermissionString, User } from 'discord.js';
import { GuildUtils, MathUtils, MessageUtils, ParseUtils } from '../utils';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { UserRepo } from '../services/database/repos';
import { channel } from 'diagnostics_channel';

export class SetAttemptsCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.setAttempts'),
        description: 'Set the attempts for a user. (Birthday bot staff only command)',
        options: [
            {
                name: Lang.getCom('arguments.user'),
                description: 'The user whose attempts you are changing.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: true,
            },
            {
                name: Lang.getCom('arguments.number'),
                description: 'The number of attempts you are setting their total to.',
                type: ApplicationCommandOptionType.Number.valueOf(),
                required: true,
                minValue: 0,
                maxValue: 127,
            },
        ],
    };
    public requireDev = true;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let target = intr.options.getUser('arguments.user');
        let amount = intr.options.getNumber('arguments.number');

        let userData = await this.userRepo.getUser(target.id);

        if (!userData) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.attemptsLeft', LangCode.EN_US)
            );
            return;
        }

        await this.userRepo.addOrUpdateUser(
            target.id,
            userData.Birthday,
            userData.TimeZone,
            amount
        );

        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('results', 'success.setAttempts', LangCode.EN_US, {
                USER: target.toString(),
                AMOUNT: amount.toString(),
            })
        );
        return;
    }
}
