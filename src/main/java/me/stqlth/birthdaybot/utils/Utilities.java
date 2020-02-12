package me.stqlth.birthdaybot.utils;

import java.util.concurrent.TimeUnit;

public class FormatTime {

    public String formatTime(long timeInMillis) {
        final long hours = timeInMillis / TimeUnit.HOURS.toMillis(1);
        final long minutes = timeInMillis / TimeUnit.MINUTES.toMillis(1);
        final long seconds = timeInMillis % TimeUnit.MINUTES.toMillis(1) / TimeUnit.SECONDS.toMillis(1);

        return String.format("%01d:%02d:%02d", hours, minutes, seconds);
    }
}
