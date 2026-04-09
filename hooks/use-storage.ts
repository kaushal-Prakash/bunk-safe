import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const STORAGE_KEY = '@user_profile';

export interface UserProfile {
  name: string;
  usn: string;
  dob: string;
}

export function useStorage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(data: UserProfile) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setProfile(data);
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }

  async function clearProfile() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setProfile(null);
    } catch (e) {
      console.error('Failed to clear profile', e);
    }
  }

  return { profile, loading, saveProfile, clearProfile };
}
