import { Guild, MessageEmbed } from 'discord.js';

import { Logger } from '../services';
import { PermissionUtils } from '../utils';
import { EventHandler } from './event-handler';

let Logs = require('../../lang/logs.json');
let Config = require('../../config/config.json');

export class GuildJoinHandler implements EventHandler {
    public async process(guild: Guild): Promise<void> {
        Logger.info(
            Logs.info.guildJoined
                .replace('{GUILD_NAME}', guild.name)
                .replace('{GUILD_ID}', guild.id)
        );

        let prefix = Config.prefix;
        let embed = new MessageEmbed()
            .setAuthor(guild.name, guild.iconURL())
            .setTitle('Thank you for using BirthdayBot!')
            .setDescription(
                `To view the commands of this bot use \`${prefix} help\`` +
                    `\nTo setup the bot run \`${prefix} setup\`` +
                    '\n\nView the [Documentation](https://birthdaybot.scottbucher.dev/) or the [FAQ](https://birthdaybot.scottbucher.dev/faq).'
            )
            .setFooter('Join our support server for help!', guild.iconURL())
            .setTimestamp()
            .setColor(Config.colors.default);

        let ownerChannel = await guild.owner.createDM();

        if (PermissionUtils.canSend(ownerChannel)) {
            await ownerChannel.send(embed);
        }
    }
}
