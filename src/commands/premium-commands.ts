import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';
import { Logger, SubscriptionService } from '../services';
import { MessageUtils, TimeUtils } from '../utils';

import { Command } from './command';
import { PlanName } from '../models/subscription-models';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class PremiumCommand implements Command {
    public name: string = 'premium';
    public aliases = ['inv'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private subscriptionService: SubscriptionService) {}

    public async execute(args: string[], msg: Message, channel: TextChannel | DMChannel) {
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

        let messagesLimitFree = Config.validation.message.maxCount.free;
        let messagesLimitPremium = Config.validation.message.maxCount.paid;

        let subStatus = await this.subscriptionService.getSubscription(
            PlanName.premium1,
            msg.guild.id
        );

        if (!subStatus || !subStatus.service) {
            let embed = new MessageEmbed()
                .setAuthor(msg.guild.name, msg.guild.iconURL())
                .setTitle('Birthday Bot Premium')
                .setDescription(
                    'Subscribe to **Birthday Bot Premium** to give this server extra features!'
                )
                .addField(
                    'Premium Features',
                    `- No voting needed for commands\n- Up to **${messagesLimitPremium.toLocaleString()}** custom birthday messages *(vs **${messagesLimitFree.toLocaleString()}** free)*\n- Access to user-specific custom birthday messages\n- Customize the color of the birthday message embed\n- Premium support\nFeatures apply **server-wide** (this server only).`
                )
                .addField('Price', '$2.99 USD / Month')
                .addField(
                    'Purchase Details',
                    `Type \`bday subscribe\` to purchase a subscription. You will then be direct messaged a PayPal link where you can checkout using your PayPal account or credit card. Your servers subscription will activate within 5 minutes of checking out with PayPal. You may cancel at any time on your [PayPal Automatic Payments](${Config.links.autopay}) page. Any paid time after cancelling will still count as premium service. As always, feel free to contact support at the link below with any questions.\n\n[Join Support Server](${Config.links.support})`
                )
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);

            Logger.info(
                Logs.info.unsubRanPremiumCmd
                    .replace('{SENDER_TAG}', msg.author.tag)
                    .replace('{SENDER_ID}', msg.author.id)
                    .replace('{GUILD_NAME}', msg.guild.name)
                    .replace('{GUILD_ID}', msg.guild.id)
            );
            return;
        }

        let lastPayment = TimeUtils.getMoment(subStatus.subscription.times.lastPayment);
        let paidUntil = TimeUtils.getMoment(subStatus.subscription.times.paidUntil);

        let embed = new MessageEmbed()
            .setAuthor(msg.guild.name, msg.guild.iconURL())
            .setTitle('Birthday Bot Premium')
            .setDescription(`This servers subscription information.`)
            .addField('Active', subStatus.service ? 'Yes' : 'No')
            .addField(
                'Subscription ID',
                subStatus.subscription.id
                    ? `[${subStatus.subscription.id}](${Config.links.autopay}/connect/${subStatus.subscription.id})`
                    : 'N/A'
            )
            .addField('Status', subStatus.subscription.status ?? 'N/A')
            .addField('Last Payment', lastPayment?.format('MMMM DD, YYYY, HH:mm UTC') ?? 'N/A')
            .addField('Paid Until', paidUntil?.format('MMMM DD, YYYY, HH:mm UTC') ?? 'N/A')
            .addField(
                'Purchase Details',
                `Type \`bday subscribe\` to purchase a subscription. You will then be direct messaged a PayPal link where you can checkout using your PayPal account or credit card. Your servers subscription will activate within 5 minutes of checking out with PayPal. You may cancel at any time on your [PayPal Automatic Payments](${Config.links.autopay}) page. Any paid time after cancelling will still count as premium service. As always, feel free to contact support at the link below with any questions.\n\n[Join Support Server](${Config.links.support})`
            )
            .setColor(Config.colors.default);
        await MessageUtils.send(channel, embed);
        return;
    }
}
