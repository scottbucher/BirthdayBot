package me.stqlth.birthdaybot.utils;


import net.dv8tion.jda.api.exceptions.ErrorHandler;
import net.dv8tion.jda.api.requests.ErrorResponse;

public final class eHandler {
	public static final ErrorHandler PERMISSION = new ErrorHandler().ignore(ErrorResponse.MISSING_PERMISSIONS);
}
