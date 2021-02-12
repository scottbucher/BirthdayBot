import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { MessageUtils, PermissionUtils } from '../utils';
import { SetupRequired, SetupTrusted } from './setup';

import { Command } from '.';
import { GuildRepo } from '../services/database/repos';
import { SetupAnniversary } from './setup/setup-anniversary';

let Config = require('../../config/config.json');

export class SetupCommand implements Command {
    public name: string = 'setup';
    public aliases = ['configure', 'set-up'];
    public requireSetup = false;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = true;

    constructor(
        private guildRepo: GuildRepo,
        private setupRequired: SetupRequired,
        private setupTrusted: SetupTrusted,
        private setupAnniversary: SetupAnniversary
    ) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        // Check for permissions
        if (!PermissionUtils.canReact(channel)) {
            let embed = new MessageEmbed()
                .setTitle('Missing Permissions!')
                .setDescription(
                    'I need permission to **Add Reactions** and **Read Message History** in this channel!'
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        // Run required setup if no arguments
        if (args.length <= 2) {
            if (
                !msg.guild.me.hasPermission('MANAGE_CHANNELS') ||
                !msg.guild.me.hasPermission('MANAGE_ROLES')
            ) {
                let embed = new MessageEmbed()
                    .setTitle('Missing Permissions!')
                    .setDescription(
                        'I need permission to **Manage Channels** and **Manage Roles**!'
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            await this.setupRequired.execute(args, msg, channel);
            return;
        }

        // Required setup is needed to run any specific setup
        let guildData = await this.guildRepo.getGuild(msg.guild.id);
        if (!guildData) {
            let embed = new MessageEmbed()
                .setTitle('Setup Required!')
                .setDescription('You must run `bday setup` before using this command!')
                .setColor(Config.colors.error);

            await MessageUtils.send(channel, embed);
            return;
        }

        // Run the appropriate setup
        switch (args[2].toLowerCase()) {
            case 'anniversary':
                await this.setupAnniversary.execute(args, msg, channel);
                return;
            case 'trusted':
                if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                    let embed = new MessageEmbed()
                        .setTitle('Not Enough Permissions!')
                        .setDescription('The bot must have permission to manage  roles!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
                await this.setupTrusted.execute(args, msg, channel, hasPremium);
                return;
            default:
                let embed = new MessageEmbed()
                    .setTitle('Invalid Usage!')
                    .setDescription(
                        `Please specify which setup you'd like to run!\n\nSetup options: \`message\` or \`trusted\``
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
        }
    }
}
