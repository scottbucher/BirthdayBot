import {
    ChatInputApplicationCommandData,
    CommandInteraction,
    Message,
    PermissionString,
    Role,
} from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, FormatUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class RoleSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('settingType.role'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [
        'ADD_REACTIONS',
        'VIEW_CHANNEL',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
    ];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let type: string;

        // prompt them for a type
        let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        });

        let _prompt = await InteractionUtils.send(
            intr,
            Lang.getEmbed('prompts', 'config.roleType', data.lang())
        );

        type = await collect(async (nextMsg: Message) => {
            let input = FormatUtils.extractRoleType(nextMsg.content.toLowerCase());
            if (!input) {
                console.log(input);
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                );
                return;
            }

            return input;
        });
        if (type === undefined) return;

        let displayType = Lang.getRef('info', `terms.${type}`, data.lang());

        let role: string;

        if (!reset) {
            let guild = intr.guild;

            let promptEmbed = Lang.getEmbed('prompts', 'config.role', data.lang(), {
                TYPE: displayType,
                TYPE_LOWERCASE: displayType.toLowerCase(),
                DOC_LINK: Lang.getCom(
                    `docLinks.whatIsBirthday${type !== 'birthday' ? 'Master' : ''}Role`
                ),
            });

            let roleOption = await CollectorUtils.getSetupChoiceFromReact(intr, data, promptEmbed);

            if (roleOption === undefined) return;

            switch (roleOption) {
                case Config.emotes.create: {
                    // Create role with desired attributes
                    role = (
                        await guild.roles.create({
                            name:
                                type === 'birthday'
                                    ? Config.emotes.birthday
                                    : Lang.getRef(
                                          'info',
                                          'defaults.birthdayMasterRoleName',
                                          data.lang()
                                      ),
                            color: Config.colors.role,
                            hoist: true,
                            mentionable: true,
                        })
                    )?.id;
                    await InteractionUtils.send(
                        intr,
                        Lang.getSuccessEmbed('results', 'successEmbeds.roleCreate', data.lang(), {
                            ROLE: `<@&${role}>`,
                        })
                    );
                    break;
                }
                case Config.emotes.select: {
                    let _selectMessage = await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('prompts', 'setup.inputRole', data.lang())
                    );

                    role = await collect(async (nextMsg: Message) => {
                        // Find mentioned role
                        let roleInput: Role = nextMsg.mentions.roles.first();

                        // Search guild for role
                        if (!roleInput) {
                            roleInput = guild.roles.cache.find(role =>
                                role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
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
                    });

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
                case Config.emotes.deny: {
                    role = '0';
                    break;
                }
            }
        } else role = '0';

        if (role === '0') {
            await InteractionUtils.send(
                intr,
                Lang.getSuccessEmbed('results', 'successEmbeds.roleClear', data.lang(), {
                    TYPE: displayType.toLowerCase(),
                })
            );
        }

        // Save the channel
        type === 'birthday'
            ? await this.guildRepo.updateBirthdayRole(intr.guild.id, role)
            : await this.guildRepo.updateBirthdayMasterRole(intr.guild.id, role);
    }
}
