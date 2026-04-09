import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Props {
  subjects: Subject[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

function getBarColor(value: number, max: number): [string, string] {
  const pct = max > 0 ? (value / max) * 100 : 0;
  if (pct >= 70) return ['#10b981', '#34d399']; // green
  if (pct >= 40) return ['#f59e0b', '#fbbf24']; // amber
  return ['#ef4444', '#f87171'];                  // red
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
      <Text style={styles.subtitle}>Continuous Internal Evaluation (CIE) breakdown.</Text>

      {subjects.map((subject, index) => {
        const total = parseFloat(subject.cie.total) || 0;
        const maxTotal = 50; // Standard CIE max

        const components = [
          { label: 'T1', value: subject.cie.t1, max: 25 },
          { label: 'T2', value: subject.cie.t2, max: 25 },
          { label: 'Q1', value: subject.cie.q1, max: 5 },
          { label: 'Q2', value: subject.cie.q2, max: 5 },
          { label: 'IL1', value: subject.cie.il1, max: 5 },
          { label: 'IL2', value: subject.cie.il2, max: 5 },
        ];

        const totalPct = (total / maxTotal) * 100;
        const totalColor = totalPct >= 70 ? '#10b981' : totalPct >= 40 ? '#f59e0b' : '#ef4444';

        return (
          <Animated.View
            key={subject.code}
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <Text style={styles.subjectName}>{subject.name}</Text>
              </View>
              <View style={[styles.totalBadge, { backgroundColor: `${totalColor}18`, borderColor: `${totalColor}30`, borderWidth: 1 }]}>
                <Text style={[styles.totalValue, { color: totalColor }]}>{subject.cie.total}</Text>
                <Text style={[styles.totalLabel, { color: totalColor }]}>/ {maxTotal}</Text>
              </View>
            </View>

            {/* Total progress bar */}
            <View style={styles.totalProgressTrack}>
              <LinearGradient
                colors={[totalColor, totalColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.totalProgressBar, { width: `${Math.min(totalPct, 100)}%` }]}
              />
            </View>
            <View style={styles.totalProgressLabels}>
              <Text style={styles.totalProgressLow}>0</Text>
              <Text style={[styles.totalProgressHigh, { color: totalColor }]}>{total}/{maxTotal}</Text>
            </View>

            <View style={styles.divider} />

            {/* Bar chart */}
            <View style={styles.chartArea}>
              {components.map((comp) => {
                const val = parseFloat(comp.value || '0') || 0;
                const barPct = comp.max > 0 ? (val / comp.max) * 100 : 0;
                const barHeightPx = Math.max((barPct / 100) * 80, val > 0 ? 4 : 2);
                const [c1, c2] = getBarColor(val, comp.max);

                return (
                  <View key={comp.label} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <LinearGradient
                        colors={[c1, c2]}
                        style={[styles.bar, { height: barHeightPx }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{comp.label}</Text>
                    <Text style={[styles.barValue, { color: c1 }]}>
                      {comp.value === '-' || !comp.value ? '—' : comp.value}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>≥70%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>40–69%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>&lt;40%</Text>
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
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    maxWidth: width * 0.5,
  },
  totalBadge: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  totalProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  totalProgressBar: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.8,
  },
  totalProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalProgressLow: {
    fontSize: 10,
    color: '#334155',
  },
  totalProgressHigh: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    marginBottom: 8,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#64748b',
  },
});
