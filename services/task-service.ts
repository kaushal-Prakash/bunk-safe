import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { StorageProvider } from '../hooks/storage-provider';

const BKG_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define how notifications should be handled when app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(BKG_SYNC_TASK, async () => {
  try {
    const rawProfile = await StorageProvider.getItem('@user_profile');
    if (!rawProfile) return BackgroundFetch.BackgroundFetchResult.NoData;
    
    // In a pure headless state without a WebView evaluating IIFEs, logging into the NIE portal 
    // using pure fetch() is extremely restrictive and risks IP blocks if cookies are rejected.
    // For v2.0 Architecture, we will dispatch a "Please open app to sync" notification if we detect 
    // it's been more than 24 hours since the last sync. 
    
    const profile = JSON.parse(rawProfile);
    if (!profile.academicData || !profile.academicData.lastUpdated) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const lastSync = new Date(profile.academicData.lastUpdated).getTime();
    const now = Date.now();
    const diffHours = (now - lastSync) / (1000 * 60 * 60);

    if (diffHours > 24) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "BunkSafe Sync Required 🔄",
          body: "It's been over 24 hours since your last sync! Tap here to securely update your attendance.",
          data: { action: 'open_sync' },
        },
        trigger: null,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background Task Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Push permissions denied.');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BKG_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BKG_SYNC_TASK, {
        minimumInterval: 60 * 60, // 1 hour
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background Sync Task Registered!');
    }
  } catch (e) {
    console.error('Failed to register task:', e);
  }
}
