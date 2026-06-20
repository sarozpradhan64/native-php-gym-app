import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { CheckCircle, Clock, PlusCircle, Timer, Pencil, X } from 'lucide-react-native';

interface ExerciseSet {
  exercise_id: number;
  set_number: number;
  reps_completed: string;
  weight_used: string;
  is_completed: boolean;
}

interface ExerciseGroup {
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  sets: ExerciseSet[];
}

const PRESET_EXERCISES = [
  { name: 'Bench Press', muscle_group: 'Chest' },
  { name: 'Squat', muscle_group: 'Legs' },
  { name: 'Deadlift', muscle_group: 'Back' },
  { name: 'Overhead Press', muscle_group: 'Shoulders' },
  { name: 'Pull-Up', muscle_group: 'Back' },
  { name: 'Barbell Row', muscle_group: 'Back' },
  { name: 'Bicep Curl', muscle_group: 'Biceps' },
  { name: 'Tricep Dip', muscle_group: 'Triceps' },
  { name: 'Leg Press', muscle_group: 'Legs' },
  { name: 'Lateral Raise', muscle_group: 'Shoulders' },
  { name: 'Romanian Deadlift', muscle_group: 'Legs' },
  { name: 'Incline Bench Press', muscle_group: 'Chest' },
  { name: 'Cable Fly', muscle_group: 'Chest' },
  { name: 'Face Pull', muscle_group: 'Shoulders' },
  { name: 'Hammer Curl', muscle_group: 'Biceps' },
];

const REST_PRESETS = [60, 90, 120, 180];

// ─── Inline-editable exercise header ─────────────────────────────────────────
function ExerciseHeader({
  group,
  onUpdate,
}: {
  group: ExerciseGroup;
  onUpdate: (exerciseId: number, name: string, muscle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.exercise_name);
  const [muscle, setMuscle] = useState(group.muscle_group);

  const save = () => {
    if (name.trim()) {
      onUpdate(group.exercise_id, name.trim(), muscle.trim() || group.muscle_group);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
        <TextInput
          style={{
            color: '#e5e2e1',
            fontSize: 16,
            fontWeight: 'bold',
            backgroundColor: '#2d2d2d',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            marginBottom: 6,
          }}
          value={name}
          onChangeText={setName}
          placeholder="Exercise name"
          placeholderTextColor="#6b6b6b"
          autoFocus
          returnKeyType="next"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{
              flex: 1,
              color: '#f2ca50',
              fontSize: 12,
              backgroundColor: '#2d2d2d',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              marginRight: 8,
            }}
            value={muscle}
            onChangeText={setMuscle}
            placeholder="Muscle group"
            placeholderTextColor="#6b6b6b"
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <TouchableOpacity onPress={save} style={{ backgroundColor: '#f2ca50', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 13 }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setName(group.exercise_name); setMuscle(group.muscle_group); setEditing(false); }} style={{ marginLeft: 8 }}>
            <X color="#6b6b6b" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d2d', flexDirection: 'row', alignItems: 'center' }}
      onPress={() => setEditing(true)}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 16 }}>{group.exercise_name}</Text>
        <Text style={{ color: '#f2ca50', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
          {group.muscle_group}
        </Text>
      </View>
      <Pencil color="#6b6b6b" size={15} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ActiveSessionScreen({ navigation }: any) {
  const db = useSQLiteContext();
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const endSession = useSessionStore(state => state.endSession);

  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [showRestModal, setShowRestModal] = useState(false);
  const startTime = useRef(Date.now());
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startRest = (secs: number) => {
    if (restRef.current) clearInterval(restRef.current);
    setRestSeconds(secs);
    setShowRestModal(true);
    restRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) { clearInterval(restRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const getOrCreateExercise = async (name: string, muscle: string): Promise<number> => {
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM exercises WHERE name = ?', [name]);
    if (existing) return existing.id;
    const r = await db.runAsync('INSERT INTO exercises (name, muscle_group) VALUES (?, ?)', [name, muscle]);
    return r.lastInsertRowId;
  };

  const addExercise = async (name: string, muscle: string) => {
    const realId = await getOrCreateExercise(name, muscle);
    setExerciseGroups(prev => {
      if (prev.find(g => g.exercise_id === realId)) return prev;
      return [...prev, {
        exercise_id: realId,
        exercise_name: name,
        muscle_group: muscle,
        sets: [{ exercise_id: realId, set_number: 1, reps_completed: '', weight_used: '', is_completed: false }],
      }];
    });
    setShowPicker(false);
    setCustomName('');
    setCustomMuscle('');
  };

  const updateExerciseMeta = async (exerciseId: number, name: string, muscle: string) => {
    await db.runAsync('UPDATE exercises SET name = ?, muscle_group = ? WHERE id = ?', [name, muscle, exerciseId]);
    setExerciseGroups(prev =>
      prev.map(g => g.exercise_id === exerciseId ? { ...g, exercise_name: name, muscle_group: muscle } : g)
    );
  };

  const addSet = (exerciseId: number) => {
    setExerciseGroups(prev =>
      prev.map(g => g.exercise_id !== exerciseId ? g : {
        ...g,
        sets: [...g.sets, { exercise_id: exerciseId, set_number: g.sets.length + 1, reps_completed: '', weight_used: '', is_completed: false }],
      })
    );
  };

  const toggleSetComplete = (exerciseId: number, idx: number) => {
    setExerciseGroups(prev =>
      prev.map(g => g.exercise_id !== exerciseId ? g : {
        ...g,
        sets: g.sets.map((s, i) => i === idx ? { ...s, is_completed: !s.is_completed } : s),
      })
    );
    startRest(90);
  };

  const updateSetValue = (exerciseId: number, idx: number, field: 'reps_completed' | 'weight_used', val: string) => {
    setExerciseGroups(prev =>
      prev.map(g => g.exercise_id !== exerciseId ? g : {
        ...g,
        sets: g.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s),
      })
    );
  };

  const finishWorkout = async () => {
    if (!activeSessionId) return;
    const totalSets = exerciseGroups.reduce((sum, g) => sum + g.sets.length, 0);
    if (totalSets === 0) {
      Alert.alert('Empty Workout', 'Add at least one exercise before finishing.', [
        { text: 'Keep Going' },
        { text: 'Discard', style: 'destructive', onPress: async () => {
          await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [activeSessionId]);
          endSession(); navigation.goBack();
        }},
      ]);
      return;
    }
    for (const g of exerciseGroups) {
      for (const s of g.sets) {
        await db.runAsync(
          'INSERT INTO workout_session_exercises (workout_session_id, exercise_id, set_number, reps_completed, weight_used, is_completed) VALUES (?,?,?,?,?,?)',
          [activeSessionId, g.exercise_id, s.set_number, parseFloat(s.reps_completed) || 0, parseFloat(s.weight_used) || 0, s.is_completed ? 1 : 0]
        );
      }
    }
    await db.runAsync('UPDATE workout_sessions SET completed_at = CURRENT_TIMESTAMP, duration = ? WHERE id = ?', [elapsed, activeSessionId]);
    endSession(); navigation.goBack();
  };

  if (!activeSessionId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#131313', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ color: '#b3b3b3', fontSize: 16, marginBottom: 16 }}>No active session.</Text>
        <TouchableOpacity style={{ backgroundColor: '#f2ca50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#3d2e00', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#131313' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 14, backgroundColor: '#1c1b1b', borderBottomWidth: 1, borderBottomColor: '#2d2d2d', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 22 }}>Active Session</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Clock color="#f2ca50" size={13} />
            <Text style={{ color: '#f2ca50', fontWeight: 'bold', marginLeft: 4, fontVariant: ['tabular-nums'] }}>{formatTime(elapsed)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#2d2d2d', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', marginRight: 10 }}
            onPress={() => setShowRestModal(true)}
          >
            <Timer color="#f2ca50" size={15} />
            <Text style={{ color: '#f2ca50', fontWeight: 'bold', marginLeft: 4, fontSize: 13 }}>{restSeconds > 0 ? formatTime(restSeconds) : 'Rest'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#f2ca50', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }} onPress={finishWorkout}>
            <Text style={{ color: '#3d2e00', fontWeight: 'bold' }}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} keyboardShouldPersistTaps="handled">
        {exerciseGroups.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#6b6b6b', textAlign: 'center' }}>Tap "+ Add Exercise" to start logging</Text>
          </View>
        )}

        {exerciseGroups.map(group => (
          <View key={group.exercise_id} style={{ backgroundColor: '#232323', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2d2d2d', overflow: 'hidden' }}>
            {/* Tap header to edit name / muscle group */}
            <ExerciseHeader group={group} onUpdate={updateExerciseMeta} />

            {/* Column labels */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#1c1b1b' }}>
              <Text style={{ color: '#6b6b6b', fontSize: 11, fontWeight: '600', width: 28 }}>SET</Text>
              <Text style={{ color: '#6b6b6b', fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' }}>KG</Text>
              <Text style={{ color: '#6b6b6b', fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' }}>REPS</Text>
              <Text style={{ color: '#6b6b6b', fontSize: 11, fontWeight: '600', width: 36, textAlign: 'center' }}>✓</Text>
            </View>

            {/* Sets */}
            {group.sets.map((set, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: set.is_completed ? 'rgba(242,202,80,0.07)' : 'transparent' }}>
                <Text style={{ color: '#6b6b6b', width: 28, fontVariant: ['tabular-nums'] }}>{set.set_number}</Text>
                <TextInput
                  style={{ flex: 1, marginHorizontal: 6, backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 8, textAlign: 'center', fontSize: 15, fontVariant: ['tabular-nums'] }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#6b6b6b"
                  value={set.weight_used}
                  onChangeText={v => updateSetValue(group.exercise_id, idx, 'weight_used', v)}
                />
                <TextInput
                  style={{ flex: 1, marginHorizontal: 6, backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 8, textAlign: 'center', fontSize: 15, fontVariant: ['tabular-nums'] }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#6b6b6b"
                  value={set.reps_completed}
                  onChangeText={v => updateSetValue(group.exercise_id, idx, 'reps_completed', v)}
                />
                <TouchableOpacity style={{ width: 36, alignItems: 'center' }} onPress={() => toggleSetComplete(group.exercise_id, idx)}>
                  <CheckCircle color={set.is_completed ? '#f2ca50' : '#6b6b6b'} size={22} fill={set.is_completed ? 'rgba(242,202,80,0.2)' : 'transparent'} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Set */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2d2d2d' }} onPress={() => addSet(group.exercise_id)}>
              <PlusCircle color="#f2ca50" size={15} />
              <Text style={{ color: '#f2ca50', marginLeft: 6, fontWeight: '600', fontSize: 13 }}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Exercise toggle */}
        <TouchableOpacity
          style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#2d2d2d', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text style={{ color: '#b3b3b3', fontWeight: '600' }}>{showPicker ? '− Close' : '+ Add Exercise'}</Text>
        </TouchableOpacity>

        {/* Exercise Picker */}
        {showPicker && (
          <View style={{ backgroundColor: '#232323', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d2d', marginBottom: 32, overflow: 'hidden' }}>
            {/* Custom entry */}
            <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
              <Text style={{ color: '#e5e2e1', fontWeight: 'bold', marginBottom: 8 }}>Custom Exercise</Text>
              <TextInput
                style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 6 }}
                placeholder="Exercise name"
                placeholderTextColor="#6b6b6b"
                value={customName}
                onChangeText={setCustomName}
                returnKeyType="next"
              />
              <TextInput
                style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8 }}
                placeholder="Muscle group"
                placeholderTextColor="#6b6b6b"
                value={customMuscle}
                onChangeText={setCustomMuscle}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={{ backgroundColor: customName.trim() ? '#f2ca50' : '#2d2d2d', borderRadius: 8, paddingVertical: 9, alignItems: 'center' }}
                onPress={() => customName.trim() && addExercise(customName.trim(), customMuscle.trim() || 'Other')}
              >
                <Text style={{ color: customName.trim() ? '#3d2e00' : '#6b6b6b', fontWeight: 'bold' }}>Add Custom</Text>
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Quick Pick</Text>
            {PRESET_EXERCISES.map(ex => (
              <TouchableOpacity
                key={ex.name}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2d2d2d' }}
                onPress={() => addExercise(ex.name, ex.muscle_group)}
              >
                <Text style={{ color: '#e5e2e1', fontWeight: '500' }}>{ex.name}</Text>
                <Text style={{ color: '#f2ca50', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>{ex.muscle_group}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Rest Timer Modal */}
      <Modal transparent visible={showRestModal} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#1c1b1b', borderRadius: 20, padding: 32, width: '100%', borderWidth: 1, borderColor: '#2d2d2d', alignItems: 'center' }}>
            <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>Rest Timer</Text>
            <Text style={{ color: restSeconds > 0 ? '#f2ca50' : '#e5e2e1', fontSize: 72, fontWeight: 'bold', fontVariant: ['tabular-nums'], marginBottom: 24 }}>
              {formatTime(restSeconds)}
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 24 }}>
              {REST_PRESETS.map(s => (
                <TouchableOpacity key={s} onPress={() => startRest(s)} style={{ backgroundColor: '#2d2d2d', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginHorizontal: 4 }}>
                  <Text style={{ color: '#e5e2e1', fontWeight: '600', fontSize: 13 }}>{s >= 60 ? `${s / 60}m` : `${s}s`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowRestModal(false)} style={{ backgroundColor: '#f2ca50', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 }}>
              <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
