import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { Logger, SubscriptionService } from '../services';

import { Command } from './command';
import { MessageUtils } from '../utils';
import { PlanName } from '../models/subscription-models';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class SubscribeCommand implements Command {
    public name: string = 'subscribe';
    public aliases = ['buy', 'purchase', 'sub'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private subscriptionService: SubscriptionService) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        if (!Config.payments.enabled) {
            let embed = new MessageEmbed()
                .setTitle('Birthday Bot Premium')
                .setDescription(
                    `Premium subscriptions are currently disabled. Enjoy premium features for free! Woohoo!`
                )
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (!Config.payments.allowNewTransactions) {
            let embed = new MessageEmbed()
                .setTitle('Birthday Bot Premium')
                .setDescription(
                    `New subscriptions are not being accepted at this time. Please try again later.\n\n[Join Support Server](${Config.links.support})`
                )
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);
            return;
        }

        let subLink = await this.subscriptionService.createSubscription(
            PlanName.premium1,
            msg.guild.id
        );
        if (!subLink) {
            let embed = new MessageEmbed()
                .setAuthor(msg.guild.name, msg.guild.iconURL())
                .setTitle('Birthday Bot Premium')
                .setDescription(
                    `This server already has an active premium subscription or one that is currently processing.\n\nYou cannot purchase premium for this server at this time. If you've recently checked out, you may need to wait for processing. If the subscription was recently cancelled you may need to wait until the paid time runs out before re-subscribing. As always, feel free to contact support at the link below with any questions.\n\n[Join Support Server](${Config.links.support})`
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let messagesLimitFree = Config.validation.message.maxCount.birthday.free;
        let messagesLimitPremium = Config.validation.message.maxCount.birthday.paid;

        let privateEmbed = new MessageEmbed()
            .setAuthor(msg.guild.name, msg.guild.iconURL())
            .setTitle('Birthday Bot Premium')
            .setDescription(
                `Complete your servers subscription by checking out with PayPal at the link below.`
            )
            .addField('Purchase Premium', `[Checkout with PayPal Here!](${subLink.link})`)
            .addField(
                'Premium Features',
                `- No voting needed for commands\n- Up to **${messagesLimitPremium.toLocaleString()}** custom birthday messages *(vs **${messagesLimitFree.toLocaleString()}** free)*\n- Access to user-specific custom birthday messages\n- Customize the color of the birthday message embed\n- Premium support\nFeatures apply **server-wide** (this server only).`
            )
            .addField('Price', '$2.99 USD / Month')
            .addField(
                'Purchase Details',
                `Your servers subscription will activate within 5 minutes of checking out with PayPal. You may cancel at any time on your [PayPal Automatic Payments](${Config.links.autopay}) page. Any paid time after cancelling will still count as premium service. As always, feel free to contact support at the link below with any questions.\n\n[Join Support Server](${Config.links.support})`
            )
            .setColor(Config.colors.default);
        await MessageUtils.send(msg.author, privateEmbed);

        let embed = new MessageEmbed()
            .setAuthor(msg.guild.name, msg.guild.iconURL())
            .setTitle('Birthday Bot Premium')
            .setDescription(
                'I have private messaged you with a PayPal subscription link!\n\nIf you did not receive a message, please make sure you have direct messages enabled for this server (under this servers Privacy Settings) and run this command again.'
            )
            .setColor(Config.colors.default);
        await MessageUtils.send(channel, embed);

        Logger.info(
            Logs.info.unsubRanSubCmd
                .replace('{SENDER_TAG}', msg.author.tag)
                .replace('{SENDER_ID}', msg.author.id)
                .replace('{GUILD_NAME}', msg.guild.name)
                .replace('{GUILD_ID}', msg.guild.id)
        );
        return;
    }
}
