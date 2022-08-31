import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    BaseCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    Modal,
    ModalSubmitInteraction,
    PermissionString,
} from 'discord.js';
import { ExpireFunction } from 'discord.js-collector-utils';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { ClientUtils, CollectorUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class RoleSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.role'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL', 'MANAGE_ROLES'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let type = 'birthday';

        let displayType = Lang.getRef('info', `terms.${type}`, data.lang());

        let role: string;
        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        };

        if (!reset) {
            let guild = intr.guild;
            let promptEmbed = Lang.getEmbed('prompts', 'config.role', data.lang(), {
                TYPE: displayType,
                TYPE_LOWERCASE: displayType.toLowerCase(),
                DOC_LINK: Lang.getCom(`docLinks.whatIsBirthdayRole`),
            });

            let roleResult = await CollectorUtils.getSetupChoiceFromButton(
                nextIntr,
                data,
                promptEmbed
            );

            if (roleResult === undefined) return;

            nextIntr = roleResult.intr;

            switch (roleResult.value) {
                case 'create': {
                    // Create role with desired attributes
                    role = (
                        await guild.roles.create({
                            name: Config.emotes.birthday,
                            color: Config.colors.role,
                            hoist: true,
                            mentionable: true,
                        })
                    )?.id;
                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getSuccessEmbed('results', 'successEmbeds.roleCreate', data.lang(), {
                            ROLE: `<@&${role}>`,
                        })
                    );
                    break;
                }
                case 'select': {
                    let rolePrompt = await InteractionUtils.sendWithEnterResponseButton(
                        nextIntr,
                        data,
                        Lang.getEmbed('prompts', 'setup.inputRole', data.lang())
                    );

                    let roleResult = await CollectorUtils.collectByModal(
                        rolePrompt,
                        new Modal({
                            customId: 'modal', // Will be overwritten
                            title: Lang.getRef('info', 'terms.birthdayRole', data.lang()),
                            components: [
                                {
                                    type: 'ACTION_ROW',
                                    components: [
                                        {
                                            type: 'TEXT_INPUT',
                                            customId: 'role',
                                            label: Lang.getRef(
                                                'info',
                                                `terms.birthdayRole`,
                                                data.lang()
                                            ),
                                            required: true,
                                            style: 'SHORT',
                                            minLength: 1,
                                            placeholder: `@${Config.emotes.birthday}`,
                                        },
                                    ],
                                },
                            ],
                        }),
                        intr.user,
                        async (intr: ModalSubmitInteraction) => {
                            let input = intr.components[0].components[0].value;

                            if (input.toLowerCase() === 'none') {
                                return { intr, value: 'none' };
                            } else {
                                // Find mentioned role
                                let birthdayRoleInput = await ClientUtils.findRole(
                                    intr.guild,
                                    input
                                );

                                // If it couldn't find the role, the role was in another guild, or the role the everyone role
                                if (
                                    !birthdayRoleInput ||
                                    birthdayRoleInput.id === guild.id ||
                                    input.toLowerCase() === 'everyone'
                                ) {
                                    InteractionUtils.send(
                                        intr,
                                        Lang.getErrorEmbed(
                                            'validation',
                                            'errorEmbeds.invalidRole',
                                            data.lang()
                                        )
                                    );
                                    return;
                                }

                                // Check the role's position
                                if (
                                    birthdayRoleInput.position >
                                    guild.members.resolve(intr.client.user).roles.highest.position
                                ) {
                                    await InteractionUtils.send(
                                        intr,
                                        Lang.getEmbed(
                                            'validation',
                                            'embeds.roleHierarchyError',
                                            data.lang(),
                                            {
                                                BOT: intr.client.user.toString(),
                                                ICON: intr.client.user.displayAvatarURL(),
                                            }
                                        )
                                    );
                                    return;
                                }

                                // Check if the role is managed
                                if (birthdayRoleInput.managed) {
                                    InteractionUtils.send(
                                        intr,
                                        Lang.getErrorEmbed(
                                            'validation',
                                            'errorEmbeds.birthdayRoleManaged',
                                            data.lang()
                                        )
                                    );
                                    return;
                                }

                                let membersWithRole = birthdayRoleInput.members.size;

                                if (membersWithRole > 0 && membersWithRole < 100) {
                                    await InteractionUtils.send(
                                        intr,
                                        Lang.getEmbed(
                                            'validation',
                                            'embeds.birthdayRoleUsedWarning',
                                            data.lang(),
                                            {
                                                AMOUNT: membersWithRole.toString(),
                                                S_Value: membersWithRole > 1 ? 's' : '',
                                                ICON: intr.client.user.displayAvatarURL(),
                                            }
                                        )
                                    );
                                } else if (membersWithRole > 100) {
                                    await InteractionUtils.send(
                                        intr,
                                        Lang.getEmbed(
                                            'validation',
                                            'embeds.birthdayRoleUsedError',
                                            data.lang(),
                                            {
                                                AMOUNT: membersWithRole.toString(),
                                                ICON: intr.client.user.displayAvatarURL(),
                                            }
                                        )
                                    );
                                    return;
                                }

                                return { intr, value: birthdayRoleInput?.id };
                            }
                        },

                        expireFunction
                    );

                    if (roleResult === undefined) return;
                    nextIntr = roleResult.intr;
                    role = roleResult.value;

                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getSuccessEmbed('results', 'successEmbeds.roleSet', data.lang(), {
                            ROLE: `<@&${role}>`,
                            TYPE: displayType.toLowerCase(),
                        })
                    );
                    break;
                }
                case 'deny': {
                    role = '0';
                    break;
                }
            }
        } else role = '0';

        if (role === '0') {
            await InteractionUtils.send(
                nextIntr,
                Lang.getSuccessEmbed('results', 'successEmbeds.roleClear', data.lang(), {
                    TYPE: displayType.toLowerCase(),
                })
            );
        }

        // Save the channel
        await this.guildRepo.updateBirthdayRole(intr.guild.id, role);
    }
}
