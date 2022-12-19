import parser, { CronDate } from 'cron-parser';
import { DateTime } from 'luxon';
import { promisify } from 'node:util';

import { UseTimeZone } from '../enums/use-time-zone.js';

let setTimeoutAsync = promisify(setTimeout);

export class TimeUtils {
    public static async sleep(ms: number): Promise<void> {
        return await setTimeoutAsync(ms);
    }

    public static now(timeZone?: string): DateTime {
        let now = DateTime.utc();
        if (timeZone) {
            now = now.setZone(timeZone);
        }
        return now;
    }

    public static nextOccurrenceOfMonthDay(month: number, day: number, timeZone: string): DateTime {
        let now = DateTime.utc().setZone(timeZone);
        let dateTime = DateTime.fromObject(
            {
                month,
                day,
            },
            { zone: timeZone }
        );
        if (dateTime < now) {
            dateTime = dateTime.plus({ year: 1 });
        }
        return dateTime;
    }

    public static isLeap(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // Function to take in a date string and timezone and return the date in UTC
    public static dateToUTC(dateString: string, timeZone: string): DateTime {
        return DateTime.fromISO(dateString, { zone: timeZone }).toUTC();
    }

    // Function to take in a date in utc and a timezone and return the date in that timezone
    public static dateFromUTC(dateString: string, timeZone: string): DateTime {
        return DateTime.fromISO(dateString).setZone(timeZone);
    }

    public static cronIntervalTime(
        cronString: string,
        timeZone: string,
        interval: number,
        currentTime: DateTime = DateTime.utc()
    ): DateTime {
        let cron = parser.parseExpression(cronString, {
            currentDate: currentTime.toISO(),
            tz: timeZone,
        });

        let cronTime: CronDate;
        if (interval === 0) {
            return currentTime;
        } else if (interval > 0) {
            for (let i = 0; i < interval; i++) {
                cronTime = cron.next();
            }
        } else if (interval < 0) {
            for (let i = 0; i < Math.abs(interval); i++) {
                cronTime = cron.prev();
            }
        }

        return DateTime.fromISO(cronTime.toISOString()).toUTC();
    }

    public static getCurrentDateTime(
        serverTimeZone: string,
        userTimeZone: string,
        useTimeZone: UseTimeZone
    ): DateTime {
        return DateTime.local({
            zone: !serverTimeZone
                ? userTimeZone
                : useTimeZone !== UseTimeZone.SERVER
                ? userTimeZone
                : serverTimeZone,
        });
    }
}
