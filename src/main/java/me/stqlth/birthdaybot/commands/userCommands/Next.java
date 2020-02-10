package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import me.stqlth.birthdaybot.config.BirthdayBotConfig;
import me.stqlth.birthdaybot.messages.debug.DebugMessages;
import me.stqlth.birthdaybot.messages.discordOut.BirthdayMessages;

public class Next extends Command {

	private BirthdayBotConfig birthdayBotConfig;
	private DebugMessages debugMessages;
	private BirthdayMessages birthdayMessages;

	public Next(BirthdayBotConfig birthdayBotConfig, DebugMessages debugMessages, BirthdayMessages birthdayMessages) {
		this.birthdayBotConfig = birthdayBotConfig;
		this.debugMessages = debugMessages;
		this.birthdayMessages = birthdayMessages;
	}

	@Override
	protected void execute(CommandEvent commandEvent) {



	}
}
