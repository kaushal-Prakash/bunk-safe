import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInDown, FadeOutRight, FadeInLeft, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  subjects: Subject[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function AttendanceTab({ subjects, onRefresh, refreshing = false }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  if (selectedSubject) {
    return <AttendanceDetailView subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
  }

  const safeSubjects = subjects.filter(s => (parseInt(s.attendance) || 0) >= 75);
  const atRiskSubjects = subjects.filter(s => (parseInt(s.attendance) || 0) < 75);
  const avgAttendance =
    subjects.length > 0
      ? Math.round(subjects.reduce((sum, s) => sum + (parseInt(s.attendance) || 0), 0) / subjects.length)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        ) : undefined
      }
    >
      <Animated.View entering={FadeInLeft} exiting={FadeOutLeft}>
        <Text style={styles.header}>Attendance Status</Text>
        <Text style={styles.subtitle}>Track your sessions across all subjects.</Text>

        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.summaryCard}>
          <LinearGradient
            colors={['rgba(59,130,246,0.15)', 'rgba(99,102,241,0.08)']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryAvgLabel}>Overall Average</Text>
              <Text style={[styles.summaryAvgValue, avgAttendance < 75 && { color: '#ef4444' }]}>
                {avgAttendance}%
              </Text>
              <View style={styles.summaryBadgeRow}>
                <View style={styles.summaryBadgeSafe}>
                  <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                  <Text style={styles.summaryBadgeSafeText}>{safeSubjects.length} Safe</Text>
                </View>
                {atRiskSubjects.length > 0 && (
                  <View style={styles.summaryBadgeRisk}>
                    <Ionicons name="warning" size={12} color="#ef4444" />
                    <Text style={styles.summaryBadgeRiskText}>{atRiskSubjects.length} At Risk</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.summaryIconBox}>
              <Ionicons name="pie-chart" size={48} color="rgba(59,130,246,0.3)" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Subjects List */}
        <View style={styles.list}>
          {subjects.map((subject, index) => {
            const pct = parseInt(subject.attendance) || 0;
            const isSafe = pct >= 75;
            const isWarning = pct >= 65 && pct < 75;
            const color = isSafe ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444';
            const bgLight = isSafe ? 'rgba(16, 185, 129, 0.1)' : isWarning ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';

            return (
              <Animated.View key={subject.code} entering={FadeInRight.delay(index * 100).duration(400)}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedSubject(subject)}>
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, marginRight: 16 }}>
                        <Text style={styles.subjectCode}>{subject.code}</Text>
                        <Text style={styles.subjectName} numberOfLines={2}>{subject.name}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: bgLight, borderColor: color }]}>
                        <Text style={[styles.badgeText, { color }]}>{pct}%</Text>
                      </View>
                    </View>

                    <View style={styles.cardProgressTrack}>
                      <View style={[styles.cardProgressBar, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                    
                    <Text style={styles.tapToViewText}>Tap to view details ›</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function AttendanceDetailView({ subject, onBack }: { subject: Subject; onBack: () => void }) {
  const dates = subject.attendanceDetails || [];
  const presentDates = dates.filter(d => d.status === 'Present');
  const absentDates = dates.filter(d => d.status === 'Absent');

  const totalClasses = presentDates.length + absentDates.length;
  const pct = parseInt(subject.attendance) || 0;
  const color = pct >= 75 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.detailCard}>
          <Text style={styles.subjectCode}>{subject.code}</Text>
          <Text style={styles.detailSubjectName}>{subject.name}</Text>

          <View style={styles.detailStatsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={[styles.statValue, { color }]}>{pct}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Attended classes</Text>
              <Text style={styles.statValue}>{presentDates.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Missed classes</Text>
              <Text style={[styles.statValue, { color: absentDates.length > 0 ? '#ef4444' : '#64748b' }]}>{absentDates.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total classes</Text>
              <Text style={styles.statValue}>{totalClasses}</Text>
            </View>
          </View>
        </View>

        {dates.length === 0 ? (
          <View style={styles.emptyDetailBox}>
            <Ionicons name="calendar-outline" size={48} color="#334155" />
            <Text style={styles.emptyDetailText}>No attendance records found yet.</Text>
          </View>
        ) : (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Class History</Text>
            {dates.map((item, i) => (
              <View key={i} style={styles.historyItem}>
                <View style={styles.historyIconBox}>
                  {item.status === 'Present' ? (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  ) : (
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  )}
                </View>
                <View style={[styles.historyInfo, { maxWidth: '60%' }]}>
                  <Text style={styles.historyDate} numberOfLines={1}>{item.date}</Text>
                  <Text style={styles.historyTime} numberOfLines={2}>{item.time}</Text>
                </View>
                <View style={[styles.historyStatusBadge, { backgroundColor: item.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <Text style={[styles.historyStatusText, { color: item.status === 'Present' ? '#10b981' : '#ef4444' }]}>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  header: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  summaryCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' },
  summaryGradient: { flexDirection: 'row', padding: 24, justifyContent: 'space-between', alignItems: 'center' },
  summaryLeft: { flex: 1 },
  summaryAvgLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryAvgValue: { fontSize: 40, fontWeight: '900', color: '#fff', marginBottom: 12 },
  summaryBadgeRow: { flexDirection: 'row', gap: 8 },
  summaryBadgeSafe: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  summaryBadgeSafeText: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  summaryBadgeRisk: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  summaryBadgeRiskText: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  summaryIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center' },
  list: { gap: 16 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  subjectCode: { fontSize: 12, fontWeight: '700', color: '#6366f1', letterSpacing: 0.5, marginBottom: 4 },
  subjectName: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', lineHeight: 22 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 16, fontWeight: '800' },
  cardProgressTrack: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' },
  cardProgressBar: { height: '100%', borderRadius: 3 },
  tapToViewText: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 16, fontWeight: '600' },
  
  // Detail View Styles
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 12, paddingRight: 20, marginBottom: 12 },
  backBtnText: { color: '#3b82f6', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  detailCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  detailSubjectName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 24, lineHeight: 28 },
  detailStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statBox: { width: '45%', backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#f1f5f9', marginTop: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  emptyDetailBox: { alignItems: 'center', paddingVertical: 64 },
  emptyDetailText: { color: '#64748b', marginTop: 16, fontSize: 16 },
  historySection: { marginTop: 16 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  historyIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  historyTime: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  historyStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  historyStatusText: { fontSize: 12, fontWeight: '800' }
});
