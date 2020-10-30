---
description: This page lists all usage and information about Birthday Bot's commands.
---

# Commands

#### Prefix: `bday`

Please note the space after **bday** in the prefix. Each command should be run as follows:  
`bday <command>`  
Example Command Usage: `bday set`

#### Utilities

`set` - Set your birthday.

`viewSets` - View how many birthday sets you have left.

`clear` - Clear your information from the database.

`next` - View the next birthday in your current guild.

`view <name>` - View a user's birthday.

`invite` - Invite Birthday Bot to your Discord.

`support` - Join the Birthday Bot support server.

#### Information

`help` - View useful information about Birthday Bot.

`help setup` - View useful information on how to setup Birthday Bot.

`help setup optional` - View useful information on how to setup the optional Birthday Bot settings.

`about` - View information about Birthday Bot.

`serverinfo` - View information about your server.

`settings` - View your server's current configuration settings.

`shard` - View information about your current shard.

#### Server Configuration \(Admins only\)

`setup` - Interactive guide for server setup.

`setup optional` - Interactive guide for optional server setup settings.

`setBirthdayRole <@role/rolename>` - Set a role to be the designated Birthday role.

`setBirthdayChannel [#channel]` - Set a channel to be the designated Birthday Channel.

`setTrustedRole <@role/rolename>` - Set a role to be the designated Trusted role.

`createBirthdayRole` - Create the default Birthday Role.

`createBirthdayChannel` - Create the default Birthday Channel.

`createTrustedRole` - Create the default Trusted Role.

`clearBirthdayRole` - Clears the Birthday Role \(Effectively Disabling this feature\).

`clearBirthdayChannel` - Clears the Birthday Channel \(Effectively Disabling this feature\).

`clearTrustedRole` - Clears the Trusted Role \(Effectively Disabling this feature\).

`config message setMention <everyone/here/@role/rolename/disable>` - Who/What role should the bot mention when the birthday message is sent.

`config message setTime <0-23>` - What time should the birthday message be sent at.

`config message set <message>` - Set the a custom birthday message for your server. Use "@Users" in the message to be replaced with the user's who's birthday it is.

`config message reset` - Set the birthday message to it's default value.

`config message useEmbed <true/false>` - Set if the Birthday Message will be embedded. \(Set false for links/images to work properly\)

`config trusted preventMessage <true/false>` - Should the bot only send birthday messages for people with the trusted role.

`config trusted preventRole <true/false>` - Should the bot only give the birthday role for people with the trusted role.
