import { Client, ClientOptions, MessageEmbed } from 'discord.js';
import { DiscordService, Logger } from '../services';
import { MessageUtils, PermissionUtils } from '../utils';
import { PlanName, SubscriptionStatusName } from '../models/subscription-models';

import { GuildRepo } from '../services/database/repos';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CustomClient extends Client {
    private discordService: DiscordService;

    constructor(clientOptions: ClientOptions, private guildRepo: GuildRepo) {
        super(clientOptions);
        this.discordService = new DiscordService(this);
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
                        let embed = new MessageEmbed()
                            .setAuthor(guild.name, guild.iconURL())
                            .setTitle('Birthday Bot Premium')
                            .setDescription(
                                `${Config.emotes.party} ${guild.name}'s premium has been successfully activated! Enjoy the new features! ${Config.emotes.party}`
                            )
                            .addField(
                                'bday premium',
                                `View details about your subscription.\n\n[Join Support Server](${Config.links.support})`
                            )
                            .setFooter(
                                'Thanks for supporting Birthday Bot!',
                                guild.client.user.avatarURL()
                            )
                            .setTimestamp();
                        MessageUtils.send(channel, embed);
                        break;
                    }
                    case SubscriptionStatusName.CANCELLED: {
                        let embed = new MessageEmbed()
                            .setAuthor(guild.name, guild.iconURL())
                            .setTitle('Birthday Bot Premium')
                            .setDescription(
                                `${guild.name}'s premium has been canceled! :(`
                            )
                            .addField(
                                'bday premium',
                                `View details about your subscription.\n\n[Join Support Server](${Config.links.support})`
                            )
                            .setFooter(
                                'Consider letting us know how to improve premium!',
                                guild.client.user.avatarURL()
                            )
                            .setTimestamp();
                            MessageUtils.send(channel, embed);
                            break;
                    }
                    case SubscriptionStatusName.EXPIRED: {
                        let embed = new MessageEmbed()
                            .setAuthor(guild.name, guild.iconURL())
                            .setTitle('Birthday Bot Premium')
                            .setDescription(
                                `${guild.name}'s premium has expired! :(`
                            )
                            .addField(
                                'bday premium',
                                `Resubscribe to premium!\n\n[Join Support Server](${Config.links.support})`
                            )
                            .setFooter(
                                'Consider letting us know how to improve premium!',
                                guild.client.user.avatarURL()
                            )
                            .setTimestamp();
                            MessageUtils.send(channel, embed);
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
