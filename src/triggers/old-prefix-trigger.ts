import { Message } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { MessageUtils } from '../utils/index.js';
import { Trigger } from './index.js';

export class OldPrefixTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return [
            'bday',
            '/bday',
            `<@${msg.client.user?.id}>`,
            `<@!${msg.client.user?.id}>`,
        ].includes(msg.content.split(' ')?.[0].toLowerCase());
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        try {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('validation', 'embeds.oldPrefixUsed', data.lang())
            );
        } catch (error) {
            // Ignore
        }
    }
}
