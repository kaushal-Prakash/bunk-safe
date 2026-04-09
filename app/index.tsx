import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useStorage, UserProfile } from '@/hooks/use-storage';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

/**
 * Bunk Safe - Main Entry Point
 * Handles Intro, Onboarding, and Dashboard logic.
 */
export default function Index() {
  const { profile, loading, saveProfile } = useStorage();
  const [showIntro, setShowIntro] = useState(true);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    usn: '',
    dob: '',
  });

  // Intro timeout
  useEffect(() => {
    if (!loading && profile) {
      // If profile exists, show intro for a moment then go to dashboard
      const timer = setTimeout(() => setShowIntro(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, profile]);

  const handleRegister = async () => {
    if (formData.name && formData.usn && formData.dob) {
      await saveProfile(formData);
      setShowIntro(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // --- 1. Dashboard State ---
  if (profile && !showIntro) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#0f172a', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View entering={FadeInDown.duration(1000)} style={styles.dashboardContent}>
          <Text style={styles.greetingTitle}>Hello,</Text>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>Welcome back to Bunk Safe.</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // --- 2. Intro State ---
  if (showIntro && (profile || !profile)) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#1e1b4b', '#000000']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View entering={FadeIn.duration(1500)} style={styles.introContent}>
          <Animated.Text entering={FadeInDown.delay(300).duration(1000)} style={styles.logoText}>
            Bunk Safe
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(800).duration(1000)} style={styles.taglineText}>
            Manage your attendance with ease.
          </Animated.Text>
          {!profile && (
            <Animated.View entering={FadeIn.delay(2000)}>
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={() => setShowIntro(false)}
              >
                <LinearGradient
                  colors={['#4f46e5', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.getStartedText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    );
  }

  // --- 3. Onboarding State ---
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#020617', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View 
        entering={FadeInUp.duration(600)} 
        style={styles.onboardingContent}
      >
        <Text style={styles.onboardingTitle}>Create Profile</Text>
        <Text style={styles.onboardingSubtitle}>Secure your academic journey.</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#64748b"
              value={formData.name}
              onChangeText={(t) => setFormData(p => ({ ...p, name: t }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>USN (Username)</Text>
            <TextInput
              style={styles.input}
              placeholder="4NI23IS001"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={formData.usn}
              onChangeText={(t) => setFormData(p => ({ ...p, usn: t }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth (Password)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={formData.dob}
              onChangeText={(t) => setFormData(p => ({ ...p, dob: t }))}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegister}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.gradientBtn}
            >
              <Text style={styles.submitText}>Save & Enter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introContent: {
    alignItems: 'center',
    padding: 20,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  taglineText: {
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  getStartedBtn: {
    marginTop: 60,
    width: width * 0.6,
    borderRadius: 30,
    overflow: 'hidden',
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  onboardingContent: {
    width: '100%',
    paddingHorizontal: 30,
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  submitBtn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBtn: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  dashboardContent: {
    padding: 30,
    width: '100%',
  },
  greetingTitle: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '500',
  },
  profileName: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '900',
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
  },
});
