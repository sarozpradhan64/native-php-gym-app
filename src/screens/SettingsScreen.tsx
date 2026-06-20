import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Moon, Bell, Info, Trash2, User, X, ChevronDown, ChevronUp, Clock } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { useRemindersStore, DayReminder } from '../store/useRemindersStore';
import { scheduleReminders, cancelAllReminders, requestNotificationPermissions } from '../utils/notifications';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { profile, setProfile } = useUserStore();
  const { reminders, setReminders, updateDay } = useRemindersStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [remindersExpanded, setRemindersExpanded] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);

  // Time picker state
  const [timePickerDay, setTimePickerDay] = useState<number | null>(null);
  const [timePickerValue, setTimePickerValue] = useState(new Date());

  // Edit Profile Modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editBirthday, setEditBirthday] = useState(profile?.birthday || '');
  const [editWeight, setEditWeight] = useState(profile?.weight?.toString() || '');
  const [editHeight, setEditHeight] = useState(profile?.height?.toString() || '');

  // Load reminders from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const rows = await db.getAllAsync<{
          day: number; enabled: number; hour: number; minute: number;
        }>('SELECT * FROM workout_reminders ORDER BY day');

        if (rows.length === 7) {
          const loaded: DayReminder[] = rows.map((r) => ({
            day: r.day,
            enabled: r.enabled === 1,
            hour: r.hour,
            minute: r.minute,
          }));
          setReminders(loaded);
          const anyEnabled = loaded.some((r) => r.enabled);
          setRemindersEnabled(anyEnabled);
          if (anyEnabled) setRemindersExpanded(true);
        }
      } catch (e) {
        console.error('Failed to load reminders', e);
      }
    })();
  }, []);

  const handleMasterToggle = async (value: boolean) => {
    setRemindersEnabled(value);
    if (value) {
      setRemindersExpanded(true);
      await requestNotificationPermissions();
    } else {
      // Disable all days
      const cleared = reminders.map((r) => ({ ...r, enabled: false }));
      setReminders(cleared);
      await cancelAllReminders();
      // Persist the clear
      await Promise.all(
        cleared.map((r) =>
          db.runAsync(
            'UPDATE workout_reminders SET enabled = 0 WHERE day = ?',
            [r.day]
          )
        )
      );
    }
  };

  const handleSaveReminders = async () => {
    setSavingReminders(true);
    try {
      for (const r of reminders) {
        await db.runAsync(
          'UPDATE workout_reminders SET enabled = ?, hour = ?, minute = ? WHERE day = ?',
          [r.enabled ? 1 : 0, r.hour, r.minute, r.day]
        );
      }
      await scheduleReminders(reminders);
      Alert.alert('Saved', 'Your workout reminders have been updated.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save reminders.');
    } finally {
      setSavingReminders(false);
    }
  };

  const openTimePicker = (day: number, hour: number, minute: number) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    setTimePickerValue(d);
    setTimePickerDay(day);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all workout history, plans, and progress. Your profile will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await db.execAsync(`
              DELETE FROM workout_session_exercises;
              DELETE FROM workout_sessions;
              DELETE FROM workout_plan_exercises;
              DELETE FROM workout_plans;
              DELETE FROM exercises;
              DELETE FROM body_measurements;
            `);
            Alert.alert('Done', 'All workout data has been cleared.');
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    const weightNum = parseFloat(editWeight) || null;
    const heightNum = parseFloat(editHeight) || null;
    try {
      await db.runAsync(
        'UPDATE user_profile SET name = ?, birthday = ?, weight = ?, height = ? WHERE id = 1',
        [editName.trim(), editBirthday.trim() || null, weightNum, heightNum]
      );
      setProfile({ name: editName.trim(), birthday: editBirthday.trim() || null, weight: weightNum, height: heightNum });
      setShowEditProfile(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const Row = ({
    icon,
    label,
    right,
    onPress,
    noBorder,
  }: {
    icon: React.ReactNode;
    label: string;
    right: React.ReactNode;
    onPress?: () => void;
    noBorder?: boolean;
  }) => {
    const content = (
      <>
        <View style={{ width: 32, alignItems: 'center', marginRight: 12 }}>{icon}</View>
        <Text style={{ color: '#e5e2e1', fontWeight: '500', flex: 1 }}>{label}</Text>
        {right}
      </>
    );
    const base: any = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: noBorder ? 0 : 1,
      borderBottomColor: '#2d2d2d',
    };
    if (onPress) {
      return <TouchableOpacity onPress={onPress} style={base}>{content}</TouchableOpacity>;
    }
    return <View style={base}>{content}</View>;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#131313' }}>
      <ScrollView contentContainerStyle={{ paddingTop: 40, paddingBottom: 80 }}>
        <Text style={{ color: '#e5e2e1', fontSize: 28, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 24 }}>
          Settings
        </Text>

        {/* ── PROFILE ── */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.card}>
          <Row
            icon={<User color="#f2ca50" size={20} />}
            label="Name"
            right={<Text style={styles.rowValue}>{profile?.name || 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
          <Row
            icon={<View />}
            label="Birthday"
            right={<Text style={styles.rowValue}>{profile?.birthday || 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
          <Row
            icon={<View />}
            label="Weight"
            right={<Text style={styles.rowValue}>{profile?.weight ? `${profile.weight} kg` : 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
          <Row
            icon={<View />}
            label="Height"
            right={<Text style={styles.rowValue}>{profile?.height ? `${profile.height} cm` : 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
            noBorder
          />
        </View>

        {/* ── PREFERENCES ── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={[styles.card, { marginBottom: remindersExpanded ? 0 : 24 }]}>
          {/* Master reminder toggle */}
          <Row
            icon={<Bell color="#f2ca50" size={20} />}
            label="Workout Reminders"
            noBorder={!remindersExpanded}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch
                  value={remindersEnabled}
                  onValueChange={handleMasterToggle}
                  trackColor={{ false: '#2d2d2d', true: '#f2ca50' }}
                  thumbColor={remindersEnabled ? '#3d2e00' : '#b3b3b3'}
                />
                {remindersEnabled && (
                  <TouchableOpacity
                    onPress={() => setRemindersExpanded((v) => !v)}
                    style={{ padding: 4 }}
                  >
                    {remindersExpanded
                      ? <ChevronUp color="#b3b3b3" size={18} />
                      : <ChevronDown color="#b3b3b3" size={18} />}
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          {/* Per-day schedule — shown when expanded */}
          {remindersExpanded && remindersEnabled && (
            <View style={{ paddingBottom: 8 }}>
              {/* Day header strip */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
                {DAY_LABELS.map((label, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => updateDay(i, { enabled: !reminders[i].enabled })}
                    style={[
                      styles.dayChip,
                      reminders[i].enabled && styles.dayChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.dayChipText,
                      reminders[i].enabled && styles.dayChipTextActive,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Per-enabled-day time rows */}
              {reminders.map((r) => (
                <View
                  key={r.day}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#2d2d2d',
                    opacity: r.enabled ? 1 : 0.38,
                  }}
                >
                  {/* Day toggle */}
                  <Switch
                    value={r.enabled}
                    onValueChange={(val) => updateDay(r.day, { enabled: val })}
                    trackColor={{ false: '#2d2d2d', true: '#f2ca50' }}
                    thumbColor={r.enabled ? '#3d2e00' : '#b3b3b3'}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={{ color: '#e5e2e1', fontWeight: '500', flex: 1 }}>
                    {DAY_FULL[r.day]}
                  </Text>
                  {/* Time button */}
                  <TouchableOpacity
                    disabled={!r.enabled}
                    onPress={() => openTimePicker(r.day, r.hour, r.minute)}
                    style={[
                      styles.timeBtn,
                      r.enabled && styles.timeBtnActive,
                    ]}
                  >
                    <Clock color={r.enabled ? '#f2ca50' : '#6b6b6b'} size={14} style={{ marginRight: 6 }} />
                    <Text style={{ color: r.enabled ? '#f2ca50' : '#6b6b6b', fontSize: 13, fontWeight: '600' }}>
                      {formatTime(r.hour, r.minute)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Save button */}
              <TouchableOpacity
                onPress={handleSaveReminders}
                disabled={savingReminders}
                style={styles.saveRemindersBtn}
              >
                {savingReminders
                  ? <ActivityIndicator color="#3d2e00" size="small" />
                  : <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 15 }}>Save Reminders</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.card, { marginBottom: 24, marginTop: remindersExpanded ? 16 : 0 }]}>
          <Row
            icon={<Moon color="#f2ca50" size={20} />}
            label="Rest Timer Sound"
            noBorder
            right={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#2d2d2d', true: '#f2ca50' }}
                thumbColor={soundEnabled ? '#3d2e00' : '#b3b3b3'}
              />
            }
          />
        </View>

        {/* ── ABOUT ── */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={[styles.card, { marginBottom: 24 }]}>
          <Row
            icon={<Info color="#b3b3b3" size={20} />}
            label="Blaze Fitness"
            right={<Text style={styles.rowValue}>v1.0.0</Text>}
            noBorder
          />
        </View>

        {/* ── DANGER ZONE ── */}
        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <View style={{ marginHorizontal: 16 }}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleClearData}
          >
            <Trash2 color="#ef4444" size={20} />
            <Text style={{ color: '#ef4444', fontWeight: '600', marginLeft: 12 }}>Clear All Workout Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── TIME PICKER ── */}
      {timePickerDay !== null && (
        <DateTimePicker
          value={timePickerValue}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event, selectedTime) => {
            setTimePickerDay(null);
            if (event.type === 'set' && selectedTime && timePickerDay !== null) {
              updateDay(timePickerDay, {
                hour: selectedTime.getHours(),
                minute: selectedTime.getMinutes(),
              });
            }
          }}
        />
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={styles.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 20 }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <X color="#6b6b6b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>NAME</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.fieldLabel}>BIRTHDAY</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b6b6b"
                  value={editBirthday}
                  editable={false}
                />
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editBirthday ? new Date(editBirthday) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && selectedDate) {
                    const f = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                    setEditBirthday(f);
                  }
                }}
              />
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editWeight}
                  onChangeText={setEditWeight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>HEIGHT (CM)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editHeight}
                  onChangeText={setEditHeight}
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleSaveProfile} style={styles.saveProfileBtn}>
              <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: '#b3b3b3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1c1b1b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  rowValue: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: '#f2ca50',
  },
  dayChipText: {
    color: '#6b6b6b',
    fontSize: 12,
    fontWeight: '700',
  },
  dayChipTextActive: {
    color: '#3d2e00',
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  timeBtnActive: {
    borderColor: '#f2ca5060',
    backgroundColor: '#f2ca5015',
  },
  saveRemindersBtn: {
    backgroundColor: '#f2ca50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  dangerBtn: {
    backgroundColor: '#1c1b1b',
    borderWidth: 1,
    borderColor: 'rgba(153,27,27,0.5)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1c1b1b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  fieldLabel: {
    color: '#b3b3b3',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#e5e2e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  saveProfileBtn: {
    backgroundColor: '#f2ca50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
