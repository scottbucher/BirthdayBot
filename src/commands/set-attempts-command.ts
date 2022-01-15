import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { UserRepo } from '../services/database/repos';
import { MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';

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
                type: ApplicationCommandOptionType.Integer.valueOf(),
                required: true,
                min_value: 0,
                max_value: 127,
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
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
        let amount = intr.options.getInteger('arguments.number');

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
            Lang.getSuccessEmbed('results', 'successEmbeds.setAttempts', LangCode.EN_US, {
                USER: target.toString(),
                AMOUNT: amount.toString(),
            })
        );
        return;
    }
}
