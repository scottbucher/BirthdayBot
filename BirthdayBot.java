import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Main {
    private static SimpleDateFormat dateFormat = new SimpleDateFormat("MM-dd");

    public static void main(String[] args) {
        List<String> birthdays = new ArrayList<>();

        String today = dateFormat.format(new Date());
        switch (today) {
            case "08-28": {
                birthdays.add("Scott");
                break;
            }
            case "11-28": {
                birthdays.add("Kevin");
                break;
            }
            default: {
                birthdays.add("No one");
                break;
            }
        }

        System.out.println("Happy Birthday " + String.join(", ", birthdays));
    }
}
