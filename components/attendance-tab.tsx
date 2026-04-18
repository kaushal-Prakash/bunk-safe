import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  subjects: Subject[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

// Removed computeBunksInfo function as per requirements

export function AttendanceTab({ subjects, onRefresh, refreshing = false }: Props) {
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
          <View style={styles.summaryRing}>
            <Text style={[styles.summaryRingValue, avgAttendance < 75 && { color: '#ef4444' }]}>
              {avgAttendance}
            </Text>
            <Text style={styles.summaryRingUnit}>%</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {subjects.map((subject, index) => {
        const percentage = parseInt(subject.attendance.replace('%', '')) || 0;
        const isWarning = percentage < 75;

        return (
          <Animated.View
            key={subject.code}
            entering={FadeInRight.delay(index * 80).duration(500)}
            style={[styles.card, isWarning && styles.cardWarning]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <Text style={styles.subjectName}>{subject.name}</Text>
              </View>
              <View style={styles.percentageBadge}>
                <Text style={[styles.percentageText, isWarning && styles.warningText]}>
                  {subject.attendance}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <LinearGradient
                colors={isWarning ? ['#ef4444', '#f87171'] : ['#10b981', '#34d399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%` }]}
              />
              {/* 75% threshold marker */}
              <View style={styles.thresholdMarker} />
            </View>

            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, isWarning ? styles.statusBadgeWarning : styles.statusBadgeSafe]}>
                <Ionicons
                  name={isWarning ? 'warning' : 'checkmark-circle'}
                  size={14}
                  color={isWarning ? '#ef4444' : '#10b981'}
                />
                <Text style={[styles.statusLabel, isWarning ? styles.statusLabelWarning : styles.statusLabelSafe]}>
                  {isWarning ? 'Below Threshold (< 75%)' : 'Safe Attendance (≥ 75%)'}
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  // Summary Card
  summaryCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  summaryGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryAvgLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryAvgValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3b82f6',
    lineHeight: 52,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  summaryBadgeSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryBadgeSafeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  summaryBadgeRisk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryBadgeRiskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  summaryRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  summaryRingValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3b82f6',
  },
  summaryRingUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 6,
  },
  // Subject cards
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardWarning: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    lineHeight: 22,
  },
  percentageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
  },
  warningText: {
    color: '#ef4444',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdMarker: {
    position: 'absolute',
    left: '75%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  cardFooter: {
    marginTop: 14,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusLabelSafe: {
    color: '#10b981',
  },
  statusLabelWarning: {
    color: '#ef4444',
  },
});
