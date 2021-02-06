import TimeAxisPreferenceInterface from "./TimeAxisPreferenceInterface";
import TimeAxisPreference from "./TimeAxisPreference";
import { TimeUnits, TimeID } from "./TimeAxisConstants";

export const TimeAxisPreferencesMap: Map<TimeID, TimeAxisPreferenceInterface> = new Map();
TimeAxisPreferencesMap.set(TimeID.YEAR, new TimeAxisPreference(TimeUnits.Year, 1, 2, true, 2000));
TimeAxisPreferencesMap.set(TimeID.MONTH_9, new TimeAxisPreference(TimeUnits.Month, 9, 4, true, 2000));
TimeAxisPreferencesMap.set(TimeID.MONTH_6, new TimeAxisPreference(TimeUnits.Month, 6, 4, true, 1200));
TimeAxisPreferencesMap.set(TimeID.MONTH_3, new TimeAxisPreference(TimeUnits.Month, 3, 4, true, 800));
TimeAxisPreferencesMap.set(TimeID.MONTH_1, new TimeAxisPreference(TimeUnits.Month, 1, 4, true, 800));
TimeAxisPreferencesMap.set(TimeID.WEEK_2, new TimeAxisPreference(TimeUnits.Week, 2, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.WEEK_1, new TimeAxisPreference(TimeUnits.Week, 1, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.DAY_1, new TimeAxisPreference(TimeUnits.Day, 1, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.HOUR_18, new TimeAxisPreference(TimeUnits.Hour, 18, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.HOUR_12, new TimeAxisPreference(TimeUnits.Hour, 12, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.HOUR_8, new TimeAxisPreference(TimeUnits.Hour, 8, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.HOUR_4, new TimeAxisPreference(TimeUnits.Hour, 4, 2, true, 800));
TimeAxisPreferencesMap.set(TimeID.HOUR_2, new TimeAxisPreference(TimeUnits.Hour, 2, 2, true, 400));
TimeAxisPreferencesMap.set(TimeID.HOUR_1, new TimeAxisPreference(TimeUnits.Hour, 1, 2, true, 400));
TimeAxisPreferencesMap.set(TimeID.MIN_30, new TimeAxisPreference(TimeUnits.Minute, 30, 2, true, 400));
TimeAxisPreferencesMap.set(TimeID.MIN_5, new TimeAxisPreference(TimeUnits.Minute, 5, 2, true, 200));
TimeAxisPreferencesMap.set(TimeID.SEG_30, new TimeAxisPreference(TimeUnits.Second, 30, 2, true, 50));
