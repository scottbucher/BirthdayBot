import { Guild, MessageEmbed, Permissions } from 'discord.js';

import { EventHandler } from './event-handler';
import { Logger } from '../services';
import { MessageUtils } from '../utils';

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
            .setTitle('Thank you for using Birthday Bot!')
            .setDescription(
                `To support the bot and unlock special features use \`${prefix} premium\` in your server.` +
                `\n\nTo view the commands of this bot use \`${prefix} help\`.` +
                    `\nTo setup the bot run \`${prefix} setup\`.` +
                    `\nTo set your birthday use \`${prefix} set\`.` +
                    `\n\nView the [Documentation](${Config.links.docs}) or the [FAQ](${Config.links.docs}/faq.).` +
                    `\nFor more support join our discord server [here](${Config.links.support})!`
            )
            .setFooter('Join our support server for help!', guild.iconURL())
            .setTimestamp()
            .setColor(Config.colors.default);

        // Get someone to message
        let user = guild.owner;
        if (!user) {
            user = guild.members.cache.find(member => member.hasPermission(Permissions.FLAGS.ADMINISTRATOR));
        }

        if (!user) return;

        let userChannel = await user.createDM();
        await MessageUtils.send(userChannel, embed);
    }
}
