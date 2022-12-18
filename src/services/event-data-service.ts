import { Loaded, MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { Guild } from 'discord.js';

import { CustomEventData, GuildData, MessageData } from '../database/entities/index.js';
import { Language } from '../models/enum-helpers/language.js';
import { EventData } from '../models/internal-models.js';

export class EventDataService {
    constructor(private orm: MikroORM<MongoDriver>) {}

    public async create(
        options: {
            guild?: Guild;
            args?: {
                messageAlias?: string;
                eventAlias?: string;
                marAlias?: string;
            };
        } = {}
    ): Promise<EventData> {
        let em = this.orm.em.fork();

        let guildData: Loaded<GuildData>;
        if (options.guild) {
            guildData = await em.findOne(GuildData, { discordId: options.guild.id });
            if (guildData) {
                await em.flush();
            }
        }

        let customEventData: Loaded<CustomEventData, 'message'>;
        let messageData: Loaded<MessageData>;

        if (options.args) {
            if (options.args.messageAlias) {
                messageData = await em.findOne(MessageData, { alias: options.args.messageAlias });
            }
            if (options.args.eventAlias) {
                customEventData = await em.findOne(
                    CustomEventData,
                    { alias: options.args.eventAlias },
                    { populate: ['message'] }
                );
            }
        }

        // Event language
        let lang =
            options.guild?.preferredLocale &&
            Language.Enabled.includes(options.guild.preferredLocale)
                ? options.guild.preferredLocale
                : Language.Default;

        // Guild language
        let langGuild =
            options.guild?.preferredLocale &&
            Language.Enabled.includes(options.guild.preferredLocale)
                ? options.guild.preferredLocale
                : Language.Default;

        return new EventData(lang, langGuild, em, guildData, messageData, customEventData);
    }
}
