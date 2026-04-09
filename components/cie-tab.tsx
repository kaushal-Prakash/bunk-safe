import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Subject } from '@/hooks/use-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Props {
  subjects: Subject[];
}

export function CieTab({ subjects }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Internal Assessments</Text>
      <Text style={styles.subtitle}>Continuous Internal Evaluation (CIE) breakdown.</Text>

      {subjects.map((subject, index) => {
        const total = parseFloat(subject.cie.total) || 0;
        const maxTotal = 50; // Standard CIE max
        
        const components = [
          { label: 'T1', value: subject.cie.t1 },
          { label: 'T2', value: subject.cie.t2 },
          { label: 'Q1', value: subject.cie.q1 },
          { label: 'Q2', value: subject.cie.q2 },
          { label: 'IL1', value: subject.cie.il1 },
          { label: 'IL2', value: subject.cie.il2 },
        ];

        return (
          <Animated.View 
            key={subject.code}
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.subjectCode}>{subject.code}</Text>
                <Text style={styles.subjectName}>{subject.name}</Text>
              </View>
              <View style={styles.totalBadge}>
                 <Text style={styles.totalValue}>{subject.cie.total}</Text>
                 <Text style={styles.totalLabel}>TOTAL</Text>
              </View>
            </View>

            <View style={styles.chartArea}>
              {components.map((comp) => {
                const val = parseFloat(comp.value || "0") || 0;
                const barHeight = Math.max((val / 25) * 80, 2); // Assuming max 25 for T
                
                return (
                  <View key={comp.label} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <LinearGradient
                        colors={['#6366f1', '#4f46e5']}
                        style={[styles.bar, { height: barHeight }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{comp.label}</Text>
                    <Text style={styles.barValue}>{comp.value === '-' ? '0' : comp.value}</Text>
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
    marginBottom: 24,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 2,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    maxWidth: width * 0.5,
  },
  totalBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6366f1',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 1,
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
    width: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: '#94a3b8',
  },
});
