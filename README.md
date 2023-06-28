# Birthday Bot

[![Discord Bots](https://top.gg/api/widget/servers/656621136808902656.svg?noavatar=true)](https://top.gg/bot/656621136808902656)
[![Discord Bots](https://top.gg/api/widget/status/656621136808902656.svg?noavatar=true)](https://top.gg/bot/656621136808902656)
[![License](https://img.shields.io/badge/license-No%20License-blue)](https://choosealicense.com/no-permission/)
[![Stars](https://img.shields.io/github/stars/scottbucher/BirthdayBot.svg)](https://github.com/scottbucher/BirthdayBot/stargazers)
[![Discord Shield](https://discord.com/api/guilds/660711235766976553/widget.png?style=shield)](https://discord.com/invite/39w2cnBRa2)
[![Discord Bots](https://top.gg/api/widget/owner/656621136808902656.svg?noavatar=true)](https://top.gg/bot/656621136808902656)

## Important Note

**For the most detailed and up-to-date information and guide please visit the Official Birthday Bot Documentation [here!](https://birthdaybot.scottbucher.dev)**

**Discord Bot** - Celebrate birthdays and anniversaries (**NEW**) with configurable roles, messages and more! Highly customizable and easy to use! Use `bday help` to get started!

## [Click here to add Birthday Bot to your Discord server!](https://discord.com/api/oauth2/authorize?client_id=656621136808902656&permissions=268921936&scope=bot%20applications.commands)

[Join The Support Server](https://discord.gg/39w2cnBRa2) | [Donate with Paypal!](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=PE97AGAPRX35Q&currency_code=USD&source=url)

# Features:

## Free Features

-   Each user can [set their birthday & time zone](https://birthdaybot.scottbucher.dev/setting-your-birthday) into the bot which stores that information into a database allowing the bot to know on what day and what time zone to celebrate the user's birthday
-   Use the Anniversary System to celebrate the anniversary of when members first joined the server and when the server was created.
    -   Requires the [server time zone](https://birthdaybot.scottbucher.dev/faq-1/general#what-is-the-server-time-zone-setting) to be set
    -   Server owners have heavy control over how, when, and what Birthday Bot does in their Discord
    -   Customization of the [Celebration Messages](https://birthdaybot.scottbucher.dev/faq-1/custom-messages#what-are-the-different-types-of-custom-messages) (Message contents and design)
        -   There can be multiple custom messages, the bot will choose one random for each birthday/anniversary
    -   Customizable Birthday Role and/or Birthday/Anniversary Channels
    -   Custom Birthday/Anniversary Message Time
    -   Customizable [trusted role system](https://birthdaybot.scottbucher.dev/faq-1/birthday-system/trusted-system) (Birthday System Only) - Using this system server owners decide whose birthdays are celebrated in their Discord. Additionally, server owners can toggle whether the Trusted Role is only required to receive the Birthday Role or Birthday Message, or both.
    -   Ban specific users or roles from having their birthday celebrated using the birthday blacklist
-   All birthdays are stored Globally. This means if you have multiple Discord servers that you own or are in with Birthday Bot, your users will only have to input their birthday and time zone once.
-   View upcoming birthdays/anniversaries.
-   Clear your information from the database at any time.
-   Near 24/7 up-time!

## [Premium Features](https://birthdaybot.scottbucher.dev/premium-features):

-   Avoid having to vote to use some commands.
-   [Priority message posting](https://birthdaybot.scottbucher.dev/premium-features#priority-message-posting).
-   Setup [member anniversary roles](https://birthdaybot.scottbucher.dev/faq-1/member-anniversaries#what-are-anniversary-roles) to celebrate how long members have been in your discord
    -   For example, the **3-Year Veteran** role can be set to be given on a member's 3 year anniversary in your discord.
-   Setup Multiple [trusted roles](https://birthdaybot.scottbucher.dev/faq-1/birthday-system/trusted-system#do-i-need-to-set-up-the-trusted-role)
    -   Use the [**RequireAllTrustedRoles**](https://birthdaybot.scottbucher.dev/faq-1/birthday-system/trusted-system#what-is-the-require-all-trusted-role-setting) setting to decide if users need all trusted roles or just one to have their birthday celebrated.
-   More control over the Custom Message(s).
    -   Up to **500** custom birthday messages (_vs_ **_3_** _for free_).
    -   Up to **500** custom member anniversary messages (_vs_ **_3_** _for free_).
    -   Up to **500** custom server anniversary messages (_vs_ **_1_** _for free_).
    -   Decide which messages are [embedded](https://birthdaybot.scottbucher.dev/faq-1/custom-messages#what-is-a-message-embed-setting) (Color setting only applies to messages that are embedded)
    -   Customize the color, title, footer, and image of each custom message! [More info.](https://birthdaybot.scottbucher.dev/faq-1/custom-messages/customizing-custom-messages)
    -   Set [user-specific custom messages](https://birthdaybot.scottbucher.dev/premium-features#user-specific-custom-messages)
        -   One custom message per user
        -   Unlimited user-specific messages per server
-   Support Development!
    -   Since I started Birthday Bot I have maintained development and server cost completely out of my own expense, Birthday Bot Premium allows me to continue to maintain development as Birthday Bot continues to gain tens of thousands of servers each month.
    -   Subscriptions to Birthday Bot Premium go straight to server costs.

### Support & Troubleshooting

Birthday Bot is a part of the Arilyn Bot family and any support, questions or feedback are welcome in our support [Discord](https://discord.com/invite/39w2cnBRa2). Please visit our [FAQ](https://birthdaybot.scottbucher.dev/faq) and setup guide, as well as previous user questions before contacting staff, thanks!

**Example Birthday Announcement (Fully customizable):**

![Example Birthday Announcement](https://i.imgur.com/BZcEJ5j.png)

In your Discord server Birthday Bot will track your users' birthdays and using their time zone celebrate their birthday through its customizable birthday role and message. Even if you have a large discord, use Birthday Bots trusted-role system to only celebrate the users you want to avoid the spam of tracking everyone. Similar messages can also be setup to celebrate the anniversary of members joining your discord server and the anniversary of the server itself!

## Setting your birthday

Birthday Bot makes everything easy using an easily to follow process.

Start by using `/set`.

![Start](https://i.imgur.com/Evo2jsp.png)

Birthday Bot uses time zones to detect when to celebrate each user's birthday. If you are unsure of your time zone you can find it [here](https://github.com/scottbucher/BirthdayBot/blob/master/README.md#finding-your-time-zone).

Now, you can then reply to this message with your desired time zone.

![Time Zone Input](https://i.imgur.com/fcmXvsQ.png)

Birthday Bot will now know your time zone and will use this to know what time to celebrate your birthday!

Now, Birthday Bot will prompt you to put your Birth Month & Date in the following format: MM/DD

![Birthday Prompt](https://i.imgur.com/hKvd9bm.png)

Simply reply to this message with your desired date.

![Birthday Input](https://i.imgur.com/D6OArx2.png)

Finally, the confirmation menu will appear.

![Confirmation](https://i.imgur.com/gBafugI.png)

Ensure this is the correct information, then confirm by clicking the checkmark.

![End](https://i.imgur.com/2F8u3Cw.png)

For users that is it! Server owners will have to do a bit more but Birthday Bot makes it easy with an interactive setup. For more information on server setup follow our guide here.

## Finding your time zone

[Kevin Novak](https://github.com/KevinNovak) has created a handy [map time zone picker](https://kevinnovak.github.io/Time-Zone-Picker/)!

Simply click your location on the map and copy the name of the selected time zone. You can then use it in the `bday set` command.

![Setting your time zone](https://i.imgur.com/ibPmjNs.png)

## Help

For additional help join the support server [here](https://discord.gg/39w2cnBRa2).

## License

Birthday Bot does not have a license. This means, while Birthday Bot's code is public to anyone, you do **NOT** have permission to modify or redistribute this code. Since there is no license, the default copyright laws apply, meaning that I retain all rights to the source code and no one may reproduce, distribute, or create derivative works from it. For more details please visit [here](https://choosealicense.com/no-permission/).
