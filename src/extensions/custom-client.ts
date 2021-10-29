import { ActivityType, Client, ClientOptions, Presence } from 'discord.js';
import { DiscordService, Lang, Logger } from '../services';
import { MessageUtils, PermissionUtils } from '../utils';
import { PlanName, SubscriptionStatusName } from '../models/subscription-models';

import { GuildRepo } from '../services/database/repos';
import { LangCode } from '../models/enums';

let Logs = require('../../lang/logs.json');

export class CustomClient extends Client {
    private discordService: DiscordService;

    constructor(clientOptions: ClientOptions, private guildRepo: GuildRepo) {
        super(clientOptions);
        this.discordService = new DiscordService(this);
    }

    public async setPresence(type: ActivityType, name: string, url: string): Promise<Presence> {
        return this.user?.setPresence({
            activities: [
                {
                    // TODO: Discord.js won't accept all ActivityType's here
                    // Need to find a solution to remove "any"
                    type: type as any,
                    name,
                    url,
                },
            ],
        });
    }

    public async notifySubscription(guildId: string, plan: string, status: string): Promise<void> {
        // Get the guild and ensure the bot is still in it
        let guild = this.guilds.cache.get(guildId);
        if (!guild) return;

        // Get the guild data
        let guildData = await this.guildRepo.getGuild(guildId);
        if (!guildData) return;

        // Get the birthday channel so we can send the message about their subscription
        let channel = await this.discordService.getTextChannel(
            guildData.GuildDiscordId,
            guildData.BirthdayChannelDiscordId
        );
        if (!channel) return;

        // Check to see if we can send a message in the channel
        if (!PermissionUtils.canSend(channel)) return;

        switch (plan) {
            case PlanName.premium1 ||
                PlanName.premium3 ||
                PlanName.premium6 ||
                PlanName.premium12: {
                switch (status) {
                    case SubscriptionStatusName.ACTIVE: {
                        MessageUtils.send(
                            channel,
                            Lang.getEmbed('premiumPrompts.subscriptionAdded', LangCode.EN_US, {
                                SERVER_NAME: guild.name,
                                ICON: guild.client.user.displayAvatarURL(),
                            })
                        );
                        break;
                    }
                    case SubscriptionStatusName.CANCELLED: {
                        MessageUtils.send(
                            channel,
                            Lang.getEmbed('premiumPrompts.subscriptionCanceled', LangCode.EN_US, {
                                SERVER_NAME: guild.name,
                                ICON: guild.client.user.displayAvatarURL(),
                            })
                        );
                        break;
                    }
                    case SubscriptionStatusName.EXPIRED: {
                        MessageUtils.send(
                            channel,
                            Lang.getEmbed('premiumPrompts.subscriptionExpired', LangCode.EN_US, {
                                SERVER_NAME: guild.name,
                                ICON: guild.client.user.displayAvatarURL(),
                            })
                        );
                        break;
                    }
                    default: {
                        break;
                    }
                }

                Logger.info(
                    Logs.info.guildSubStatus
                        .replace('{GUILD_NAME}', guild.name)
                        .replace('{GUILD_ID}', guild.id)
                        .replace('{PLAN_NAME}', plan)
                        .replace('{SUBSCRIPTION_STATUS}', status)
                );
            }
        }
    }
}
