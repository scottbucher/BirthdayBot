---
description: Frequently Asked Questions about Birthday Bot
---

# FAQ

## Can I set birthdays for my users?

No, unfortunately birthdays are stored **globally** this means your birthday in Discord A is the same as in Discord B. As a result, we cannot give server owners control over their user's information, due to it being able to effect other servers.

## Birthday Bot announced/gave the birthday role/message at the incorrect time?

There are two things that effect a birthday message time.

First is your guild server message time \(Configure this with **bday config message setTime &lt;0-23&gt;**\), if for example you run this **bday config message setTime 9** the birthday **message** will send at 9am **for the birthday user**.

Secondly is the birthday user's time zone which is set when users run **bday set**. For example, if my time zone is America/New_York, and my guild message time \(see above\) is 9am, the birthday role will be given at 12am in **America/New_York**, and the birthday message will be sent at 9am **America/New_York**.

If you are in a different time zone then the birthday user, the birthday message and/or the birthday role may appear to have sent at an incorrect time.

## I entered my time zone as EST but Birthday Bot detected the wrong time zone?

As shown when a user runs **bday set** Birthday Bot does **not** accept abbreviated time zones like **EST**, **UST**, etc. However, even when users enter an incorrect time zone, Birthday Bot will attempt to find the best fit for the user. For example, entering **newyork** as your time zone will trigger the bot to detect **America/New_York** as your time zone, or in this case entering **EST** as your time zone will trigger the bot to select the Australia/W**EST** time zone.

## Do I need to setup the Trusted Role?

No, the trusted role falls under the category of "Optional Server Settings", this means the bot will run perfectly fine without having the trusted role set.

However, the trusted role system is a feature if servers need to limit which users should have their birthday celebrated. A good example of the trusted role system in use is our [Discord support server](https://discord.gg/9gUQFtz). In our support server we have our trusted role set as the Staff role, this is so only our staff have their birthdays celebrated in the support server.

## I can't find my time zone?

[KevinNovak](https://github.com/KevinNovak) has created a handy [map time zone picker](https://kevinnovak.github.io/Time-Zone-Picker//)!

Simply click your location on the map, and use the name displayed in the drop-down box as your time zone.

You can then take your time zone name and use it in the `bday set` command

## How many times can I set my birthday?

Each user can set their birthday & time zone **five** times.

I understand sometimes users may accidentally input the wrong information or switch time zones. However, I wanted to ensure users could not infinitely abuse the Birthday system by continuously setting their birthday. As a result, I decided to give a fixed number of "birthday sets" to address both concerns.

If you find yourself in a position where you are out of "birthday sets", exceptions to this fixed rule **may** apply to you, visit our [support server](https://discord.com/invite/9gUQFtz) to request assistance from a developer.
