import { useState, useEffect } from 'react';
import { StorageProvider } from './storage-provider';

const STORAGE_KEY = '@user_profile';

export interface SubjectCie {
  t1?: string;
  t2?: string;
  q1?: string;
  q2?: string;
  il1?: string;
  il2?: string;
  total: string;
}

export interface Subject {
  code: string;
  name: string;
  attendance: string;
  cie: SubjectCie;
}

export interface AcademicData {
  lastUpdated: string;
  subjects: Subject[];
}

export interface UserProfile {
  name: string;
  usn: string;
  dob: string;
  academicData?: AcademicData;
}

/**
 * Unified storage hook that uses platform-specific providers.
 * No native imports are done in this file to avoid web-bundling errors.
 */
export function useStorage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const stored = await StorageProvider.getItem(STORAGE_KEY);
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
      const stringified = JSON.stringify(data);
      await StorageProvider.setItem(STORAGE_KEY, stringified);
      setProfile(data);
    } catch (e) {
      console.error('Failed to save profile', e);
      throw e;
    }
  }

  async function clearProfile() {
    try {
      await StorageProvider.removeItem(STORAGE_KEY);
      setProfile(null);
    } catch (e) {
      console.error('Failed to clear profile', e);
    }
  }

  return { profile, loading, saveProfile, clearProfile };
}
