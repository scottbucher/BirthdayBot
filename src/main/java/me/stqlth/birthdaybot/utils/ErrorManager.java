package me.stqlth.birthdaybot.utils;


import net.dv8tion.jda.api.exceptions.ErrorHandler;
import net.dv8tion.jda.api.requests.ErrorResponse;

public final class ErrorManager {
	public static final ErrorHandler GENERAL = new ErrorHandler().ignore(ErrorResponse.MISSING_PERMISSIONS, ErrorResponse.UNKNOWN_MESSAGE, ErrorResponse.UNKNOWN_CHANNEL, ErrorResponse.UNKNOWN_EMOJI,
			ErrorResponse.EMBED_DISABLED, ErrorResponse.MISSING_ACCESS);
	public static final ErrorHandler GUILD_MESSAGE = new ErrorHandler().ignore(ErrorResponse.MISSING_PERMISSIONS, ErrorResponse.EMPTY_MESSAGE,
			ErrorResponse.MISSING_ACCESS, ErrorResponse.INVALID_MESSAGE_TARGET, ErrorResponse.EMPTY_MESSAGE, ErrorResponse.UNKNOWN_CHANNEL);
	public static final ErrorHandler PRIVATE = new ErrorHandler().ignore(ErrorResponse.CANNOT_SEND_TO_USER, ErrorResponse.MISSING_PERMISSIONS);
	public static final ErrorHandler EDIT_ROLE = new ErrorHandler().ignore(ErrorResponse.MISSING_PERMISSIONS, ErrorResponse.MISSING_ACCESS);

}
