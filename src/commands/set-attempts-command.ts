import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { Command, CommandDeferType } from './index.js';

export class SetAttemptsCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.setAttempts'),
        description: 'Set the attempts for a user. (Birthday bot staff only command)',
        dm_permission: false,
        default_member_permissions: undefined,
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
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let target = intr.options.getUser(Lang.getCom('arguments.user'));
        let amount = intr.options.getInteger(Lang.getCom('arguments.number'));

        let userData = await this.userRepo.getUser(target.id);

        if (!userData) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.attemptsLeft', data.lang())
            );
            return;
        }

        await this.userRepo.addOrUpdateUser(
            target.id,
            userData.Birthday,
            userData.TimeZone,
            amount
        );

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.setAttempts', data.lang(), {
                USER: target.toString(),
                AMOUNT: amount.toString(),
            })
        );
        return;
    }
}
