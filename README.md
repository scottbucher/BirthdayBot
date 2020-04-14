
# Birthday Bot

**Discord Bot** - Track and celebrate birthdays in your discord server! Use `bday help` to get started!

## [Click here to add Birthday Bot to your Discord server!](https://discordapp.com/api/oauth2/authorize?client_id=656621136808902656&permissions=269053008&scope=bot)

[Join The Support Server](https://discord.gg/24xS3N5) | [Donate with Paypal!](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=PE97AGAPRX35Q&currency_code=USD&source=url)

In your discord server Birthday Bot will track your users' birthdays and using their timezone celebrate their birthday through its customizable birthday role and message. Even if you have a large discord use Birthday Bot's trusted-role system to only celebrate the users you want to avoid the spam of tracking everyone.

Start by using `bday set`

![Example Start](https://i.imgur.com/lEt7I0J.png)

### Finding Your Time Zone

[Keval Bhatt](https://github.com/kevalbhatt) has created a handy map time zone picker:

<http://kevalbhatt.github.io/timezone-picker/>

Simply click your location on the map, and use the name displayed in the dropdown box as your time zone.

You can then take your time zone name and use it in the `bday set` command

![Setting your time zone](https://i.imgur.com/Mtpx86n.png)

Birthday Bot will then know your timezone and will use this to know when to celebrate your birthday.

Full Example usage of `bday set`

![Example usage](https://i.imgur.com/rJXpDss.png)

For users that's it! Server owners will have to do a bit more but Birthday Bot makes it easy with an interactive setup commands `bday setup` and `bday setup optional`!

## Commands

The following are commands for BirthdayBot. To run a command, prefix the command with `bday `, for example, `bday help` or `@BirthdayBot help`.

### Info

* `help` - View useful information about BirthdayBot.
* `help setup` - View useful information on how to setup Birthday Bot.
* `help setup option` - View useful information on how to setup the optional Birthday Bot settings.
* `about` - View information about BirthdayBot.
* `serverinfo` - View information about your server.
* `settings` - View your server's current configuration settings.
* `shard` - View information about your current shard.

### Server Configuration (Admins only)

* `bday setup` - Interactive guide for server setup.
* `bday setup optional` - Interactive guide for optional server setup settings.

* `SetBirthdayRole <@role/rolename>` - Set a role to be the designated Birthday role.
* `SetBirthdayChannel [#channel]` - Set a channel to be the designated Birthday Channel.
* `SetTrustedRole <@role/rolename>` - Set a role to be the designated Trusted role.
* `CreateBirthdayRole` - Create the default Birthday Role.
* `CreateBirthdayChannel` - Create the default Birthday Channel.
* `CreateTrustedRole` - Create the default Trusted Role.
* `ClearBirthdayRole` - Clears the Birthday Role (Effectively Disabling this feature).
* `ClearBirthdayChannel` - Clears the Birthday Channel (Effectively Disabling this feature).
* `ClearTrustedRole` - Clears the Trusted Role (Effectively Disabling this feature).
* `config trusted preventMessage <true/false>` - Should the bot only send birthday messages for people with the trusted role.
* `config trusted preventRole <true/false>` - Should the bot only give the birthday role for people with the trusted role.
* `config mentionSetting <everyone/here/@role/rolename/disable>` - Who/What role should the bot mention when the birthday message is sent.
* `config messageTime <0-23>` - What time should the birthday message be sent at.
* `config setMessage` - Set the a custom birthday message for your server. Use "@Users" in the message to be replaced with the user's who's birthday it is.
* `config resetMessage` - Set the birthday message to it's default value.

### Utilities

* `set` - Set your birthday.
* `next` - View the next birthday in your current guild.
* `view <name>` - View a user's birthday.
* `invite` - Invite Birthday Bot to your discord.
* `support` - Join the Birthday Bot support server.

## Help

For additional help contact **Stqlth#0001** or join the support server [here](https://discord.gg/24xS3N5).
