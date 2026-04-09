import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  subjects: Subject[];
}

export function AttendanceTab({ subjects }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Attendance Status</Text>
      <Text style={styles.subtitle}>Track your sessions across all subjects.</Text>

      {subjects.map((subject, index) => {
        const percentage = parseInt(subject.attendance.replace('%', '')) || 0;
        const isWarning = percentage < 75;

        return (
          <Animated.View 
            key={subject.code}
            entering={FadeInRight.delay(index * 100).duration(500)}
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
                style={[styles.progressBar, { width: `${percentage}%` }]}
              />
            </View>
            
            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, isWarning ? styles.statusBadgeWarning : styles.statusBadgeSafe]}>
                <Ionicons 
                  name={isWarning ? "warning" : "checkmark-circle"} 
                  size={16} 
                  color={isWarning ? "#ef4444" : "#10b981"} 
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
    marginBottom: 24,
  },
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
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusBadgeSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusLabelSafe: {
    color: '#10b981',
  },
  statusLabelWarning: {
    color: '#ef4444',
  },
});
