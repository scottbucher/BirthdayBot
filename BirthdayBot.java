import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Main {
    private static SimpleDateFormat dateFormat = new SimpleDateFormat("MM-dd");

    public static void main(String[] args) {
        String today = dateFormat.format(new Date());

        List<String> birthdays = new ArrayList<>();

        switch (today) {
            case "08-28": {
                birthdays.add("Scott");
            }
            case "11-28": {
                birthdays.add("Kevin");
            }
            default: {
                birthdays.add("No one");
            }
        }

        System.out.println("Happy Birthday " + String.join(", ", birthdays));
    }
}
