---
description: >-
    This guide aims to help walk you through each step of Birthday Bot's optional
    server setup process as well as show the functionality of our interactive
    setup commands.
---

# Optional Setup

In this guide we will be using Birthday Bot's interactive setup command.

Start by using `bday setup optional`.

![](https://i.imgur.com/upglSWT.png)

The first prompt in the optional setup process will ask for a time to send the birthday message. This server setting allows server admins to prevent pinging users at the default midnight time.

For this example we will input 9 as our time, which corresponds to 9-AM.

{% hint style="warning" %}
The only input accepted for this step is 0-23, 0 being 12-AM \(midnight\), and 23 being 11-PM.
{% endhint %}

![](https://i.imgur.com/cprwqh0.png)

Once your birthday message time is set, you will receive the next prompt for a custom birthday message.

![](https://i.imgur.com/XzKmkB9.png)

The custom birthday message is very customizable and allows for a placeholder of `@Users` which will, when the birthday message runs, replace itself with the birthday user\(s\) names. If you wish to not have a custom birthday message input `default` to set the message to its default value.

For this example we will input a custom birthday message using the **@Users** placeholder.

![](https://i.imgur.com/SAiLDer.png)

{% hint style="info" %}
As the message states, if you are unsure if you used the **@Users** place holder correct or simply want to see what a birthday message would look like, run the **bday testMessage** command.
{% endhint %}

Once you have set the custom birthday message, you will now receive a prompt to set which group to mention when running the birthday message.

![](https://i.imgur.com/7gqJXss.png)

Whichever group or role you select will be the group/role which is mentioned \(@Input\) when a birthday message is sent.

For this example we will select the input `everyone`, which will @everyone when a birthday message is sent.

{% hint style="info" %}
You do not have to mention the group/role when inputting your desired setting.
{% endhint %}

![](https://i.imgur.com/Kpfvfnt.png)

The next prompt will ask you to setup the trusted role.

![](https://i.imgur.com/7BeIKYb.png)

You now have three options to choose from to set your trusted role. The first, will automatically generate the default trusted role, the second, will allow you to choose from your servers current roles, the third will skip setting a trusted role.

For this example we will choose the **second** option.

![](https://i.imgur.com/JROtyJ1.png)

Even if you don't tag the role in your input, Birthday Bot will try and find matching roles, in this case we mentioned the role, however, had we not, Birthday Bot would have attempted to find the closest role.

{% hint style="info" %}
If your desired role is not **mention-able** in the Discord role settings, you will not be able to mention the role in your input.
{% endhint %}

Once the trusted role has been set, the next prompt will ask about trusted role options.

![](https://i.imgur.com/utDudaa.png)

This setting decides if users need the trusted role in order to receive the birthday role on their birthday.

For this example we will select **Yes** by clicking the check-mark.

![](https://i.imgur.com/7CnjuGk.png)

The final prompt is similar to the last.

![](https://i.imgur.com/5Q7Hdpf.png)

This setting decides if users need the trusted role in order to receive the birthday message on their birthday.

For this example we will select **No** by clicking the **X**.

![](https://i.imgur.com/YnPZFEK.png)

The bot now knows \(In this example\) to send a birthday message for all users, regardless of role, but to only give the special birthday role to those with the trusted role.

This completes the optional setup process. For other server setting commands which are not in the setup interactive guide please visit [here](../commands.md#server-configuration-admins-only).
