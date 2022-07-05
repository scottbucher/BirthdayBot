import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ButtonInteraction, CommandInteraction, Message, PermissionString, Role } from 'discord.js';
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

        let nextIntr: CommandInteraction | ButtonInteraction = intr;

        if (!reset) {
            let guild = intr.guild;

            let promptEmbed = Lang.getEmbed('prompts', 'config.role', data.lang(), {
                TYPE: displayType,
                TYPE_LOWERCASE: displayType.toLowerCase(),
                DOC_LINK: Lang.getCom(`docLinks.whatIsBirthdayRole`),
            });

            let roleResult = await CollectorUtils.getSetupChoiceFromButton(intr, data, promptEmbed);

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
                    let _selectMessage = await InteractionUtils.send(
                        nextIntr,
                        Lang.getEmbed('prompts', 'setup.inputRole', data.lang())
                    );

                    role = await CollectorUtils.collectByMessage(
                        intr.channel,
                        intr.user,
                        async (nextMsg: Message) => {
                            // Find mentioned role
                            let roleInput: Role = nextMsg.mentions.roles.first();

                            // Search guild for role
                            if (!roleInput) {
                                roleInput = await ClientUtils.findRole(
                                    intr.guild,
                                    nextMsg?.content
                                );
                            }

                            // If it couldn't find the role, the role was in another guild, or the role the everyone role
                            if (
                                !roleInput ||
                                roleInput.id === guild.id ||
                                nextMsg?.content.toLowerCase() === 'everyone'
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
                                roleInput.position >
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
                            if (roleInput.managed) {
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

                            let membersWithRole = roleInput.members.size;

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

                            return roleInput?.id;
                        },
                        async () => {
                            await InteractionUtils.send(
                                intr,
                                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                            );
                        }
                    );

                    if (role === undefined) {
                        return;
                    }
                    await InteractionUtils.send(
                        intr,
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
