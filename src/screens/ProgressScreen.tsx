import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  TrendingUp,
  Activity,
  Calendar,
  Dumbbell,
  Ruler,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react-native';

interface SessionStat {
  id: number;
  started_at: string;
  duration: number;
  plan_name: string;
  set_count: number;
}

interface VolumeStat {
  exercise_name: string;
  total_volume: number;
  last_weight: number;
}

interface Measurement {
  id: number;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  bicep_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
}

const MEASUREMENT_FIELDS: { key: keyof Omit<Measurement, 'id' | 'recorded_at' | 'notes'>; label: string; unit: string }[] = [
  { key: 'weight_kg',    label: 'Body Weight',  unit: 'kg' },
  { key: 'body_fat_pct', label: 'Body Fat',     unit: '%'  },
  { key: 'chest_cm',     label: 'Chest',        unit: 'cm' },
  { key: 'waist_cm',     label: 'Waist',        unit: 'cm' },
  { key: 'hips_cm',      label: 'Hips',         unit: 'cm' },
  { key: 'bicep_cm',     label: 'Bicep',        unit: 'cm' },
  { key: 'thigh_cm',     label: 'Thigh',        unit: 'cm' },
];

type TabKey = 'workouts' | 'measurements';

export default function ProgressScreen() {
  const db = useSQLiteContext();
  const [tab, setTab] = useState<TabKey>('workouts');

  // Workout stats
  const [sessions, setSessions] = useState<SessionStat[]>([]);
  const [volumeStats, setVolumeStats] = useState<VolumeStat[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  // Measurements
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newMeasurement, setNewMeasurement] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const loadAll = async () => {
    // Sessions
    const allSessions = await db.getAllAsync<SessionStat>(`
      SELECT s.id, s.started_at, s.duration,
        p.name as plan_name,
        COUNT(e.id) as set_count
      FROM workout_sessions s
      LEFT JOIN workout_plans p ON s.workout_plan_id = p.id
      LEFT JOIN workout_session_exercises e ON e.workout_session_id = s.id
      WHERE s.completed_at IS NOT NULL
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT 20
    `);
    setSessions(allSessions);
    setTotalWorkouts(allSessions.length);

    const allSets = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM workout_session_exercises WHERE is_completed = 1'
    );
    setTotalSets(allSets?.total ?? 0);

    const vol = await db.getAllAsync<VolumeStat>(`
      SELECT ex.name as exercise_name,
        SUM(e.weight_used * e.reps_completed) as total_volume,
        MAX(e.weight_used) as last_weight
      FROM workout_session_exercises e
      JOIN exercises ex ON e.exercise_id = ex.id
      WHERE e.is_completed = 1
      GROUP BY e.exercise_id
      ORDER BY total_volume DESC
      LIMIT 5
    `);
    setVolumeStats(vol);

    // Measurements
    const m = await db.getAllAsync<Measurement>(
      'SELECT * FROM body_measurements ORDER BY recorded_at DESC LIMIT 30'
    );
    setMeasurements(m);
  };

  const saveMeasurement = async () => {
    const vals = newMeasurement;
    await db.runAsync(
      `INSERT INTO body_measurements 
       (weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        parseFloat(vals.weight_kg) || null,
        parseFloat(vals.body_fat_pct) || null,
        parseFloat(vals.chest_cm) || null,
        parseFloat(vals.waist_cm) || null,
        parseFloat(vals.hips_cm) || null,
        parseFloat(vals.bicep_cm) || null,
        parseFloat(vals.thigh_cm) || null,
        vals.notes?.trim() || null,
      ]
    );
    setNewMeasurement({});
    setShowAddModal(false);
    loadAll();
  };

  const deleteMeasurement = (id: number) => {
    Alert.alert('Delete Entry', 'Remove this measurement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
        loadAll();
      }},
    ]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (secs: number) => secs ? `${Math.floor(secs / 60)} min` : '—';

  // ── Workouts tab ────────────────────────────────────────────────────────────
  const WorkoutsTab = () => (
    <>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: '#232323', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2d2d2d', marginRight: 12, alignItems: 'center' }}>
          <Calendar color="#f2ca50" size={20} />
          <Text style={{ color: '#e5e2e1', fontSize: 28, fontWeight: 'bold', marginTop: 6 }}>{totalWorkouts}</Text>
          <Text style={{ color: '#b3b3b3', fontSize: 12, marginTop: 2 }}>Workouts</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#232323', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2d2d2d', alignItems: 'center' }}>
          <Activity color="#f2ca50" size={20} />
          <Text style={{ color: '#e5e2e1', fontSize: 28, fontWeight: 'bold', marginTop: 6 }}>{totalSets}</Text>
          <Text style={{ color: '#b3b3b3', fontSize: 12, marginTop: 2 }}>Sets Done</Text>
        </View>
      </View>

      {volumeStats.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <TrendingUp color="#f2ca50" size={16} />
            <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Top Lifts</Text>
          </View>
          <View style={{ backgroundColor: '#232323', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d2d', overflow: 'hidden' }}>
            {volumeStats.map((stat, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#2d2d2d' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#6b6b6b', fontSize: 12, width: 22 }}>{i + 1}</Text>
                  <Text style={{ color: '#e5e2e1', fontWeight: '500' }}>{stat.exercise_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#f2ca50', fontWeight: 'bold' }}>{stat.last_weight} kg</Text>
                  <Text style={{ color: '#6b6b6b', fontSize: 11 }}>{Math.round(stat.total_volume)} kg vol</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Dumbbell color="#f2ca50" size={16} />
        <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>History</Text>
      </View>
      {sessions.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: '#232323', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d2d', borderStyle: 'dashed' }}>
          <Text style={{ color: '#6b6b6b' }}>No completed workouts yet.</Text>
        </View>
      ) : sessions.map(s => (
        <View key={s.id} style={{ backgroundColor: '#232323', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2d2d2d', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, backgroundColor: 'rgba(242,202,80,0.12)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Dumbbell color="#f2ca50" size={16} />
            </View>
            <View>
              <Text style={{ color: '#e5e2e1', fontWeight: '600' }}>{s.plan_name ?? 'Freestyle'}</Text>
              <Text style={{ color: '#6b6b6b', fontSize: 12, marginTop: 1 }}>{formatDate(s.started_at)}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#f2ca50', fontWeight: 'bold', fontSize: 13 }}>{formatDuration(s.duration)}</Text>
            <Text style={{ color: '#6b6b6b', fontSize: 11 }}>{s.set_count} sets</Text>
          </View>
        </View>
      ))}
    </>
  );

  // ── Measurements tab ────────────────────────────────────────────────────────
  const MeasurementsTab = () => (
    <>
      {measurements.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: '#232323', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d2d', borderStyle: 'dashed', marginBottom: 12 }}>
          <Ruler color="#6b6b6b" size={28} />
          <Text style={{ color: '#6b6b6b', marginTop: 8 }}>No measurements logged yet.</Text>
        </View>
      )}
      {measurements.map(m => (
        <View key={m.id} style={{ backgroundColor: '#232323', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#2d2d2d', overflow: 'hidden' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 }}
            onPress={() => setExpandedId(expandedId === m.id ? null : m.id)}
          >
            <View>
              <Text style={{ color: '#e5e2e1', fontWeight: '600' }}>{formatDate(m.recorded_at)}</Text>
              {m.weight_kg && (
                <Text style={{ color: '#f2ca50', fontSize: 13, marginTop: 2 }}>{m.weight_kg} kg body weight</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => deleteMeasurement(m.id)} style={{ padding: 6, marginRight: 4 }}>
                <X color="#6b6b6b" size={16} />
              </TouchableOpacity>
              <ChevronDown color="#6b6b6b" size={18} style={{ transform: [{ rotate: expandedId === m.id ? '180deg' : '0deg' }] }} />
            </View>
          </TouchableOpacity>
          {expandedId === m.id && (
            <View style={{ paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#2d2d2d' }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                {MEASUREMENT_FIELDS.map(f => {
                  const val = m[f.key];
                  if (!val) return null;
                  return (
                    <View key={f.key} style={{ width: '50%', paddingVertical: 4 }}>
                      <Text style={{ color: '#6b6b6b', fontSize: 11 }}>{f.label}</Text>
                      <Text style={{ color: '#e5e2e1', fontWeight: '600' }}>{val} {f.unit}</Text>
                    </View>
                  );
                })}
              </View>
              {m.notes && <Text style={{ color: '#b3b3b3', fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>{m.notes}</Text>}
            </View>
          )}
        </View>
      ))}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#131313' }}>
      {/* Page header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 14, backgroundColor: '#131313' }}>
        <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 30 }}>Progress</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#232323', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {(['workouts', 'measurements'] as TabKey[]).map(t => (
          <TouchableOpacity
            key={t}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: tab === t ? '#f2ca50' : 'transparent' }}
            onPress={() => setTab(t)}
          >
            <Text style={{ color: tab === t ? '#3d2e00' : '#b3b3b3', fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 80 }}>
        {tab === 'workouts' ? <WorkoutsTab /> : <MeasurementsTab />}
      </ScrollView>

      {/* FAB — only on measurements tab */}
      {tab === 'measurements' && (
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{ position: 'absolute', bottom: 90, right: 20, backgroundColor: '#f2ca50', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#f2ca50', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}
        >
          <Plus color="#3d2e00" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Add Measurement Modal */}
      <Modal transparent visible={showAddModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1c1b1b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#2d2d2d' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 20 }}>Log Measurements</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setNewMeasurement({}); }}>
                <X color="#6b6b6b" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                {MEASUREMENT_FIELDS.map(f => (
                  <View key={f.key} style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                    <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 4 }}>{f.label} ({f.unit})</Text>
                    <TextInput
                      style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 }}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor="#6b6b6b"
                      value={newMeasurement[f.key] ?? ''}
                      onChangeText={v => setNewMeasurement(prev => ({ ...prev, [f.key]: v }))}
                    />
                  </View>
                ))}
              </View>
              <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 4 }}>Notes</Text>
              <TextInput
                style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 20 }}
                placeholder="Optional notes..."
                placeholderTextColor="#6b6b6b"
                value={newMeasurement.notes ?? ''}
                onChangeText={v => setNewMeasurement(prev => ({ ...prev, notes: v }))}
                multiline
              />
            </ScrollView>

            <TouchableOpacity
              onPress={saveMeasurement}
              style={{ backgroundColor: '#f2ca50', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>Save Measurement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
