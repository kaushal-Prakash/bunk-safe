/**
 * Native-specific storage provider using @react-native-async-storage/async-storage.
 * This file is picked up by Expo when building for iOS or Android.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageProvider = {
  getItem: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
};
