import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView
} from 'react-native';
import { UserProfile } from '@/hooks/use-storage';
import { Ionicons } from '@expo/vector-icons';
import packageJson from '../package.json';

const APP_VERSION = packageJson.version;

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => Promise<void>;
  onClear: () => Promise<void>;
}

export function SettingsTab({ profile, onUpdate, onClear }: Props) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);

  const handleSave = async () => {
    const sanitized = (formData.fatherMobileLast4 || '').replace(/\D/g, '').slice(-4);
    await onUpdate({
      ...formData,
      fatherMobileLast4: sanitized
    });
    setEditing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          {editing ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(t) => setFormData(p => ({ ...p, name: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>USN</Text>
                <TextInput
                  style={styles.input}
                  value={formData.usn}
                  onChangeText={(t) => setFormData(p => ({ ...p, usn: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DOB (DD-MM-YYYY)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dob}
                  onChangeText={(t) => setFormData(p => ({ ...p, dob: t }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Father Mobile Last 4 Digits</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={formData.fatherMobileLast4 || ''}
                  onChangeText={(t) => setFormData(p => ({ ...p, fatherMobileLast4: t.replace(/\D/g, '').slice(0, 4) }))}
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.btnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{profile.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>USN</Text>
                <Text style={styles.infoValue}>{profile.usn}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DOB</Text>
                <Text style={styles.infoValue}>{profile.dob}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Father Mobile Last 4</Text>
                <Text style={styles.infoValue}>{profile.fatherMobileLast4 || 'Not set'}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onClear}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Reset App Data</Text>
          </TouchableOpacity>
        </View>

      <View style={styles.footer}>
        <Text style={styles.devTag}>Developed with ❤️ by</Text>
        <Text style={styles.devName}>Kaushal Prakash</Text>
        <Text style={styles.version}>Bunk Safe v{APP_VERSION}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 250,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  editText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 8,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    marginTop: 8,
  },
  cancelText: {
    color: '#ef4444',
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  devTag: {
    fontSize: 12,
    color: '#64748b',
  },
  devName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  version: {
    fontSize: 10,
    color: '#334155',
    marginTop: 20,
  },
});
