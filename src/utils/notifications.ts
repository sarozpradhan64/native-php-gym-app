import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DayReminder } from '../store/useRemindersStore';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_TAG = 'blaze-fitness-workout-reminder';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleReminders(reminders: DayReminder[]): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel all existing app reminders first
  await cancelAllReminders();

  const enabledDays = reminders.filter((r) => r.enabled);
  if (enabledDays.length === 0) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  for (const reminder of enabledDays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 Time to Train!',
        body: "Your Blaze Fitness workout is ready. Let's crush it today!",
        sound: true,
        data: { tag: NOTIFICATION_TAG, day: reminder.day },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: reminder.day + 1, // expo-notifications: 1=Sun, 2=Mon … 7=Sat
        hour: reminder.hour,
        minute: reminder.minute,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const appNotifs = scheduled.filter(
    (n) => n.content.data?.tag === NOTIFICATION_TAG
  );

  await Promise.all(
    appNotifs.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}
