import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import {
    ChatInputApplicationCommandData,
    CommandInteraction,
    DMChannel,
    PermissionString,
} from 'discord.js';
import moment from 'moment';

import { EventData } from '../models/index.js';
import { UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class ViewCommand implements Command {
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('commands.view'),
        description: `View your, or someone else's birthday or anniversary. Or view the server's anniversary.`,
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to view.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'BIRTHDAY',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'MEMBER_ANNIVERSARY',
                    },
                ],
            },
            {
                name: Lang.getCom('arguments.user'),
                description: 'Optional user argument to view. Defaults to you.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: false,
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')) ?? 'BIRTHDAY';
        let target = intr.options.getUser(Lang.getCom('arguments.user')) ?? intr.user;

        if (target !== intr.user && intr.channel instanceof DMChannel) {
            InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.viewUserInDm', data.lang())
            );
            return;
        }

        switch (type) {
            case 'BIRTHDAY': {
                let userData = await this.userRepo.getUser(target.id);

                if (!userData || !userData.Birthday || !userData.TimeZone) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.birthdayNotSet',
                            data.lang(),
                            {
                                USER: target.toString(),
                            }
                        )
                    );
                    return;
                }

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.viewBirthday', data.lang(), {
                        USER: target.toString(),
                        BIRTHDAY: moment(userData.Birthday).format('MMMM Do'),
                        TIMEZONE: userData.TimeZone,
                    })
                );
                break;
            }
            case 'MEMBER_ANNIVERSARY': {
                if (intr.channel instanceof DMChannel) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.memberAnniversaryInDM',
                            data.lang()
                        )
                    );
                    return;
                }
                let guildMember = intr.guild.members.resolve(target.id);
                let memberAnniversary = moment(guildMember.joinedAt).format('MMMM Do');

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.viewMemberAnniversary', data.lang(), {
                        USER: target.toString(),
                        DATE: memberAnniversary,
                    })
                );
                break;
            }
        }
    }
}
