import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
    // 1. Android Specific: Channels are MANDATORY for SDK 53+ local notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 2. Request Permissions (Handles Expo Go limitation gracefully)
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions denied.');
      return;
    }

    // 3. Register Background Task
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BKG_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BKG_SYNC_TASK, {
        minimumInterval: 60 * 60, // 1 hour
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background Sync Task Registered!');
    }
  } catch (e: any) {
    // Expo Go SDK 53+ on Android triggers a loud error for remote notifications. 
    // We catch it here so it doesn't break the app initialization.
    if (e.message?.includes('removed from Expo Go')) {
      console.warn('⚠️ Push Notifications Error: Expo Go (SDK 53/54) does not support remote push tokens. Local notifications may still work.');
    } else {
      console.error('Failed to register task:', e);
    }
  }
}
