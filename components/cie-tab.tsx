import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Props {
  subjects: Subject[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

function getAccentColor(pct: number): string {
  if (pct >= 70) return '#10b981';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

export function CieTab({ subjects, onRefresh, refreshing = false }: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        ) : undefined
      }
    >
      <Text style={styles.header}>Internal Assessments</Text>
      <Text style={styles.subtitle}>CIE marks breakdown per subject</Text>

      {subjects.map((subject, index) => {
        const total = parseFloat(subject.cie.total) || 0;
        const maxTotal = 100;

        // Dynamic marks array from scraper, with fallback
        const components: { label: string; value: string; max: number }[] = subject.cie.marks || [
          { label: 'T1', value: subject.cie.t1 || '0', max: 25 },
          { label: 'T2', value: subject.cie.t2 || '0', max: 25 },
          { label: 'Q1', value: subject.cie.q1 || '0', max: 5 },
          { label: 'Q2', value: subject.cie.q2 || '0', max: 5 },
          { label: 'IL1', value: subject.cie.il1 || '0', max: 5 },
          { label: 'IL2', value: subject.cie.il2 || '0', max: 5 },
        ];

        const totalPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
        const accent = getAccentColor(totalPct);

        return (
          <Animated.View
            key={subject.code}
            entering={FadeInDown.delay(index * 80).duration(400)}
            style={styles.card}
          >
            {/* Subject header */}
            <View style={styles.cardTop}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <Text style={styles.subjectName} numberOfLines={2}>{subject.name}</Text>
              </View>
            </View>

            {/* Component marks grid */}
            <View style={styles.marksGrid}>
              {components.map((comp) => {
                const isNotTaken = comp.value === 'Not Taken' || (comp.value === '0' && comp.max === 0);
                const numVal = parseFloat(comp.value) || 0;
                const pct = comp.max > 0 && !isNotTaken ? (numVal / comp.max) * 100 : 0;
                const compAccent = isNotTaken ? '#94a3b8' : getAccentColor(pct);

                // Display value: show actual scraped value, not parsed
                let displayVal: string;
                if (isNotTaken) {
                  displayVal = 'N/A';
                } else if (comp.value && comp.value !== '-' && comp.value !== '0') {
                  displayVal = `${comp.value}/${comp.max}`;
                } else if (numVal > 0) {
                  displayVal = `${numVal}/${comp.max}`;
                } else {
                  displayVal = `0/${comp.max}`;
                }

                return (
                  <View key={comp.label} style={styles.markItem}>
                    <Text style={styles.markLabel}>{comp.label}</Text>
                    <Text style={[styles.markValue, { color: compAccent }]}>{displayVal}</Text>
                    <View style={styles.markBar}>
                      <View
                        style={[
                          styles.markBarFill,
                          {
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: compAccent,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
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
    paddingBottom: 120,
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // --- Card header ---
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  subjectInfo: {
    flex: 1,
    marginRight: 16,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    lineHeight: 20,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  totalMax: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // --- Progress bar ---
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // --- Marks grid ---
  marksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  markItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: (width - 80) / 3,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  markLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  markValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  markBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  markBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
