import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';

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
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <Text style={styles.subjectName}>{subject.name}</Text>
              </View>
              <Text style={[styles.percentageText, isWarning && styles.warningText]}>
                {subject.attendance}
              </Text>
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
              <Text style={styles.statusLabel}>
                {isWarning ? '⚠️ Below Threshold (75%)' : '✅ Safe Attendance'}
              </Text>
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
    marginBottom: 2,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '900',
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
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
