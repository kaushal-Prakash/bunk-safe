import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Animated, { 
  FadeIn, 
  FadeOut, 
  FadeInDown,
  FadeInRight,
  FadeOutLeft
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStorage, AcademicData, Subject } from '@/hooks/use-storage';
import { ScraperScripts } from '@/services/scraper-service';
import { StatusBar } from 'expo-status-bar';

// Components
import { AttendanceTab } from '@/components/attendance-tab';
import { CieTab } from '@/components/cie-tab';
import { SettingsTab } from '@/components/settings-tab';

function getRelativeTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const { width } = Dimensions.get('window');

type Tab = 'attendance' | 'cie' | 'settings';
type SyncStatus = 'idle' | 'logging_in' | 'fetching_list' | 'fetching_details' | 'finishing' | 'error';

export default function Index() {
  const { profile, loading, saveProfile, clearProfile } = useStorage();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [relativeTime, setRelativeTime] = useState('');
  
  // Scraping State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [subjectsToFetch, setSubjectsToFetch] = useState<any[]>([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(-1);
  const [tempAcademicData, setTempAcademicData] = useState<Subject[]>([]);
  
  const webViewRef = useRef<WebView>(null);
  const watchdogRef = useRef<any>(null);
  const [webViewUrl, setWebViewUrl] = useState('https://parents.nie.ac.in/index.php');

  // Update relative time every 30s
  useEffect(() => {
    if (!profile?.academicData) return;
    setRelativeTime(getRelativeTime(profile.academicData.lastUpdated));
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(profile.academicData!.lastUpdated));
    }, 30000);
    return () => clearInterval(interval);
  }, [profile?.academicData?.lastUpdated]);

  const resetWatchdog = () => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(() => {
      setSyncStatus('error');
      setSyncError('Sync timed out. Please check your internet or USN/DOB.');
    }, 45000); // 45s global timeout
  };

  useEffect(() => {
    if (!loading && !profile) {
      setShowOnboarding(true);
    }
  }, [loading, profile]);

  // --- SCRAPER ORCHESTRATION ---

  const startSync = useCallback(() => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSyncError(null);
    setSyncStatus('logging_in');
    setSyncProgress(0.1);
    setTempAcademicData([]);
    setWebViewUrl('https://parents.nie.ac.in/index.php');
    
    // Force a reload to guarantee onLoadEnd fires, as the URL might not have changed
    setTimeout(() => {
      webViewRef.current?.reload();
    }, 100);
    resetWatchdog();
  }, [profile]);

  const onWebViewMessage = (event: WebViewMessageEvent) => {
    resetWatchdog();
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      
      if (type === 'LOG') {
        console.log('[WebView Scraper]:', data);
        return;
      }

      if (type === 'ERROR') {
        setSyncStatus('error');
        setSyncError(data);
      } else if (type === 'RETRY_LIST') {
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(ScraperScripts.scrapeSubjectList);
        }, 1500);
      } else if (type === 'RETRY_DETAILS') {
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(ScraperScripts.scrapeSubjectDetails);
        }, 1500);
      } else if (type === 'SUBJECT_LIST') {
        setSubjectsToFetch(data);
        setSyncStatus('fetching_details');
        setSyncProgress(0.3);
        if (data.length > 0) {
          setCurrentSubjectIndex(0);
          webViewRef.current?.injectJavaScript(`window.location.href = "${data[0].cieLink}"; true;`);
        } else {
          finishSync([]);
        }
      } else if (type === 'SUBJECT_DETAILS') {
        const subject = subjectsToFetch[currentSubjectIndex];
        const newDetails: Subject = {
          code: subject.code,
          name: subject.name,
          attendance: data.attendance,
          cie: data.cie
        };
        
        const updatedTemp = [...tempAcademicData, newDetails];
        setTempAcademicData(updatedTemp);
        
        const nextIndex = currentSubjectIndex + 1;
        const progress = 0.3 + (nextIndex / subjectsToFetch.length) * 0.6;
        setSyncProgress(progress);

        if (nextIndex < subjectsToFetch.length) {
          setCurrentSubjectIndex(nextIndex);
          webViewRef.current?.injectJavaScript(`window.location.href = "${subjectsToFetch[nextIndex].cieLink}"; true;`);
        } else {
          finishSync(updatedTemp);
        }
      }
    } catch (e) {
      console.error('Scraper Message Error:', e);
    }
  };

  const onWebViewLoadEnd = () => {
    // Add a 2s delay after page load to let portal JS finish rendering
    setTimeout(() => {
      if (syncStatus === 'logging_in') {
        webViewRef.current?.injectJavaScript(ScraperScripts.login(profile!.usn, profile!.dob));
        setSyncStatus('fetching_list');
      } else if (syncStatus === 'fetching_list') {
        webViewRef.current?.injectJavaScript(ScraperScripts.scrapeSubjectList);
      } else if (syncStatus === 'fetching_details') {
        webViewRef.current?.injectJavaScript(ScraperScripts.scrapeSubjectDetails);
      }
    }, 2500);
  };

  const finishSync = async (data: Subject[]) => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    setSyncStatus('finishing');
    setSyncProgress(1);
    
    if (profile) {
      await saveProfile({
        ...profile,
        academicData: {
          lastUpdated: new Date().toISOString(),
          subjects: data
        }
      });
    }
    
    setTimeout(() => setSyncStatus('idle'), 1000);
  };

  if (loading) return null;

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} saveProfile={saveProfile} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
      
      {/* Hidden Scraper */}
      <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
        <WebView 
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          onMessage={onWebViewMessage}
          onLoadEnd={onWebViewLoadEnd}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      {/* Syncing Overlay */}
      {syncStatus !== 'idle' && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.syncOverlay}>
          <View style={styles.syncCard}>
            {syncStatus === 'error' ? (
              <>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.syncTitle}>Sync Failed</Text>
                <Text style={styles.syncSubtitle}>{syncError || 'Unknown error occurred'}</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setSyncStatus('idle')}>
                  <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.syncTitle}>
                  {syncStatus === 'logging_in' ? 'Connecting...' : 'Syncing Portal...'}
                </Text>
                <Text style={styles.syncSubtitle}>
                  {syncStatus === 'fetching_details' 
                    ? `Scraping Subject ${currentSubjectIndex + 1}/${subjectsToFetch.length}`
                    : 'Logging in to your student accounts...'}
                </Text>
                <View style={styles.syncProgressTrack}>
                  <View style={[styles.syncProgressBar, { width: `${syncProgress * 100}%` }]} />
                </View>
              </>
            )}
          </View>
        </Animated.View>
      )}

      {/* Dashboard Top bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {profile?.name.split(' ')[0]} 👋</Text>
          <Text style={styles.lastUpdate}>
            {profile?.academicData 
              ? `Last synced: ${relativeTime || getRelativeTime(profile.academicData.lastUpdated)}`
              : 'Sync required to view data'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.syncBtn, syncStatus !== 'idle' && styles.syncBtnDisabled]} 
          onPress={startSync} 
          disabled={syncStatus !== 'idle'}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Page Content */}
      <View style={styles.content}>
        {activeTab === 'attendance' && (
           profile?.academicData ? (
             <AttendanceTab 
               subjects={profile.academicData.subjects}
               onRefresh={startSync}
               refreshing={syncStatus !== 'idle'}
             />
           ) : (
             <EmptyState onSync={startSync} />
           )
        )}
        {activeTab === 'cie' && (
           profile?.academicData ? (
             <CieTab 
               subjects={profile.academicData.subjects}
               onRefresh={startSync}
               refreshing={syncStatus !== 'idle'}
             />
           ) : (
             <EmptyState onSync={startSync} />
           )
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            profile={profile!} 
            onUpdate={saveProfile} 
            onClear={clearProfile} 
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomNav}>
        <NavButton 
          active={activeTab === 'attendance'} 
          icon="stats-chart" 
          label="Attendance" 
          onPress={() => setActiveTab('attendance')} 
        />
        <NavButton 
          active={activeTab === 'cie'} 
          icon="document-text" 
          label="CIE" 
          onPress={() => setActiveTab('cie')} 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          icon="settings" 
          label="Settings" 
          onPress={() => setActiveTab('settings')} 
        />
      </View>
    </View>
  );
}

function NavButton({ active, icon, label, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.navBtn}>
      <Ionicons name={active ? icon : `${icon}-outline`} size={22} color={active ? '#3b82f6' : '#64748b'} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      {active && <View style={styles.navActiveDot} />}
    </TouchableOpacity>
  );
}

function EmptyState({ onSync }: { onSync: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="cloud-download-outline" size={64} color="#1e293b" />
      <Text style={styles.emptyTitle}>No Data Found</Text>
      <Text style={styles.emptySubtitle}>Sync with the student portal to fetch your academic records.</Text>
      <TouchableOpacity style={styles.emptySyncBtn} onPress={onSync}>
        <Text style={styles.emptySyncText}>Sync Now</Text>
      </TouchableOpacity>
    </View>
  );
}

function Onboarding({ onComplete, saveProfile }: any) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [dob, setDob] = useState('');

  const handleFinish = async () => {
    if (!name || !usn || !dob) {
      Alert.alert('Missing Info', 'Please fill all fields');
      return;
    }
    await saveProfile({ name, usn, dob });
    onComplete();
  };

  const slides = [
    {
      title: "BunkSafe.",
      tag: "Never miss a safe attendance threshold again.",
      icon: "shield-checkmark",
    },
    {
      title: "100% Private.",
      tag: "Your data is never stored on any server. Everything is scraped and saved locally on your device.",
      icon: "lock-closed",
    },
    {
      title: "Auto Sync.",
      tag: "We connect directly to your student portal in the background to fetch your latest CIE and Attendance.",
      icon: "sync-circle",
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
      
      {step < slides.length ? (
        <Animated.View key={`slide-${step}`} entering={FadeInRight} exiting={FadeOutLeft} style={styles.onboardStep}>
           <Ionicons name={slides[step].icon as any} size={64} color="#3b82f6" style={{ marginBottom: 20 }} />
           <Text style={styles.onboardHero}>{slides[step].title}</Text>
           <Text style={styles.onboardTag}>{slides[step].tag}</Text>
           
           <View style={styles.slideIndicators}>
             {slides.map((_, i) => (
                <View key={i} style={[styles.indicatorDot, i === step && styles.indicatorDotActive]} />
             ))}
           </View>

           <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(step + 1)}>
             <Text style={styles.primaryBtnText}>{step === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
           </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown} style={styles.onboardStep}>
          <Text style={styles.formTitle}>Profile Setup</Text>
          <View style={styles.form}>
             <TextInput 
               placeholder="Full Name" 
               placeholderTextColor="#64748b" 
               style={styles.input} 
               value={name}
               onChangeText={setName}
             />
             <TextInput 
               placeholder="USN" 
               placeholderTextColor="#64748b" 
               style={styles.input} 
               autoCapitalize="characters"
               value={usn}
               onChangeText={setUsn}
             />
             <TextInput 
               placeholder="DOB (DD-MM-YYYY)" 
               placeholderTextColor="#64748b" 
               style={styles.input} 
               value={dob}
               onChangeText={setDob}
             />
             <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
               <Text style={styles.primaryBtnText}>Access Dashboard</Text>
             </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  syncBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  syncBtnDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#3b82f6',
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  syncCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  syncTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 24,
  },
  syncSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  syncProgressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  syncProgressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  onboardStep: {
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  onboardHero: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 64,
    letterSpacing: -2,
  },
  onboardTag: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 20,
    marginBottom: 40,
    lineHeight: 26,
  },
  slideIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  indicatorDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicatorDotActive: {
    width: 24,
    backgroundColor: '#3b82f6',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  formTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  emptySyncBtn: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  emptySyncText: {
    color: '#3b82f6',
    fontWeight: '700',
  }
});
