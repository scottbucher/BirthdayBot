package me.stqlth.birthdaybot.utils;

import me.stqlth.birthdaybot.config.BirthdayBotConfig;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;

public class Logger {
    private static final SimpleDateFormat TIMESTAMP_FORMAT = new SimpleDateFormat("YYYY-MM-DD HH:mm:ss.SSS");

    private static final String INFO_PREFIX = "[Info]";
    private static final String WARN_PREFIX = "[Warn]";
    private static final String ERROR_PREFIX = "[Error]";
    private static final String DEBUG_PREFIX = "[Debug]";

    public static void Info(String message) {
        String log = GetCurrentTimestamp() + " " + INFO_PREFIX + " " + message;
        Output(log);
    }

    public static void Warn(String message) {
        String log = GetCurrentTimestamp() + " " + WARN_PREFIX + " " + message;
        Output(log);
    }

    public static void Debug(String message) {
        if (!BirthdayBotConfig.isDebug()) return;

        String log = GetCurrentTimestamp() + " " + DEBUG_PREFIX + " " + message;
        Output(log);
    }

    public static void Error(String message) {
        String log = GetCurrentTimestamp() + " " + ERROR_PREFIX + " " + message;
        Output(log);
    }

    public static void Error(String message, Throwable ex) {
        String log = GetCurrentTimestamp() + " " + ERROR_PREFIX + " " + message + " Exception: " + Arrays.toString(ex.getStackTrace());
        Output(log);
    }

    public static void Error(String message, Exception ex) {
        String log = GetCurrentTimestamp() + " " + ERROR_PREFIX + " " + message + " Exception: " + Arrays.toString(ex.getStackTrace());
        Output(log);
    }
    private static void Output(String log) {
        System.out.println(log);
    }

    private static String GetCurrentTimestamp() {
        Calendar calendar = Calendar.getInstance();
        Date currentTime = calendar.getTime();
        return TIMESTAMP_FORMAT.format(currentTime);
    }
}
