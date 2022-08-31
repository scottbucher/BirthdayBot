---
description: >-
  This guide aims to help walk you through each step of the server setup process
  as well as show the functionality of our interactive setup commands.
---

# Required Setup

In this guide we will be using Birthday Bot's interactive setup command.

Start by using `bday setup`.

![](https://i.imgur.com/4825Sg3.png)

You now have three options to choose from to set your birthday channel. The first, will automatically generate the default birthday channel, the second, will allow you to choose from your servers current channels, the third will skip setting a birthday channel.

For this example we will choose the **second** option.

![](https://i.imgur.com/lnrdnEL.png)

Even if you don't tag the channel \(Example: \#birthdays\) in your input, Birthday Bot will try and find matching channels, in this case, it detected the correct channel!

Once the birthday channel is set, you will receive a second prompt.

![](https://i.imgur.com/rvoIvKk.png)

This prompt is very similar to the previous with the same three options, however, this time, for the birthday **role**. 

Again, we will choose the second option.

![](https://i.imgur.com/w2s3DPc.png)

{% hint style="warning" %}
As the message states, the Birthday Bot **Role** must be higher than the Birthday Role **and** higher than any role which it is giving the Birthday Role to. Example: To give the Birthday Role to a user whose highest role is the Member role, the Birthday Bot Role must be higher than both.
{% endhint %}

Much like setting the birthday channel, if we would have not mentioned the role directly, Birthday Bot would have tried to detect the role from our input.

{% hint style="info" %}
If your desired role is not **mention-able** in the Discord role settings, you will not be able to mention the role in your input.
{% endhint %}

This completes the required setup process. Read about an optional setup guide [here](optional-setup.md) or view other server setting commands [here](../commands.md#server-configuration-admins-only).





