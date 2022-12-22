import { ChatInputCommandInteraction, DMChannel, PermissionsString } from 'discord.js';
import { DateTime } from 'luxon';

import { UserData } from '../../database/entities/user.js';
import { CelebrationType, DataValidation, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Command, CommandDeferType } from '../command.js';

export class ViewCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.view', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let type =
            (intr.options.getString(
                Lang.getRef('commands', 'arguments.type', Language.Default)
            ) as CelebrationType) ?? CelebrationType.BIRTHDAY;
        let target =
            intr.options.getUser(Lang.getRef('commands', 'arguments.user', Language.Default)) ??
            intr.user;

        if (target !== intr.user && intr.channel instanceof DMChannel) {
            InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.viewUserInDm', data.lang)
            );
            return;
        }

        switch (type) {
            case CelebrationType.BIRTHDAY: {
                let userData = await data.em.findOne(
                    UserData,
                    { discordId: target.id },
                    { populate: ['birthday', 'timeZone'] }
                );

                if (!userData || !userData.birthday || !userData.timeZone) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.birthdayNotSet', data.lang, {
                            USER: target.toString(),
                        })
                    );
                    return;
                }

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.viewBirthday', data.lang, {
                        USER: target.toString(),
                        BIRTHDAY: DateTime.fromFormat(userData?.birthday, 'LL-d').toFormat(
                            'LLLL d',
                            {
                                locale: data.lang,
                            }
                        ),
                        TIMEZONE: userData.timeZone,
                    })
                );
                break;
            }
            case CelebrationType.MEMBER_ANNIVERSARY: {
                if (intr.channel instanceof DMChannel) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.memberAnniversaryInDM',
                            data.lang
                        )
                    );
                    return;
                }
                let guildMember = intr.guild.members.resolve(target.id);
                let memberAnniversary = DateTime.fromJSDate(guildMember.joinedAt).toFormat(
                    'LLLL d',
                    {
                        locale: data.lang,
                    }
                );

                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('results', 'success.viewMemberAnniversary', data.lang, {
                        USER: target.toString(),
                        DATE: memberAnniversary,
                    })
                );
                break;
            }
        }
    }
}
