package me.stqlth.birthdaybot.config;

import org.json.JSONArray;
import org.json.JSONObject;

public class BirthdayBotConfig {
    private static JSONObject _configJson;

    public BirthdayBotConfig(JSONObject configJson) {
        _configJson = configJson;
    }

    public static String getDbUrl() {
        return _configJson.getString("dbUrl");
    }

    public static String getDbUser() {
        return _configJson.getString("dbUser");
    }

    public static String getDbPassword() {
        return _configJson.getString("dbPassword");
    }

    public static String getToken() { return _configJson.getString("token"); }

    public static String getBotId() { return _configJson.getString("botId"); }

    public static String getBotListToken() { return _configJson.getString("botListToken"); }

    public static String getOwnerId() { return _configJson.getString("ownerId"); }

    public static String getPrefix() { return  _configJson.getString("prefix"); }

    public static boolean isDebug() { return  _configJson.getBoolean("debug"); }

    public static boolean updateApi() { return  _configJson.getBoolean("debug"); }

    public static JSONArray getRegions() { return _configJson.getJSONArray("regions"); }
}

