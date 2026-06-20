import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Pencil, X, GripVertical } from 'lucide-react-native';

interface PlanExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  target_sets: number;
  target_reps: number;
  order_index: number;
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

// ─── Inline-editable exercise card ───────────────────────────────────────────
function ExerciseCard({
  ex,
  onDelete,
  onUpdateName,
  onUpdateSetsReps,
  drag,
  isActive,
}: {
  ex: PlanExercise;
  onDelete: (id: number) => void;
  onUpdateName: (id: number, exerciseId: number, name: string, muscle: string) => void;
  onUpdateSetsReps: (id: number, field: 'target_sets' | 'target_reps', value: string) => void;
  drag: () => void;
  isActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ex.exercise_name);
  const [muscle, setMuscle] = useState(ex.muscle_group);

  const saveName = () => {
    if (name.trim()) {
      onUpdateName(ex.id, ex.exercise_id, name.trim(), muscle.trim() || ex.muscle_group);
    } else {
      setName(ex.exercise_name);
      setMuscle(ex.muscle_group);
    }
    setEditing(false);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={drag}
      delayLongPress={200}
      style={{ backgroundColor: '#232323', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: isActive ? '#f2ca50' : '#2d2d2d', overflow: 'hidden' }}
    >
      {/* Header — tap pencil to edit */}
      {editing ? (
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
          <TextInput
            style={{ color: '#e5e2e1', fontSize: 16, fontWeight: 'bold', backgroundColor: '#2d2d2d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 }}
            value={name}
            onChangeText={setName}
            placeholder="Exercise name"
            placeholderTextColor="#6b6b6b"
            autoFocus
            returnKeyType="next"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ flex: 1, color: '#f2ca50', fontSize: 12, backgroundColor: '#2d2d2d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8 }}
              value={muscle}
              onChangeText={setMuscle}
              placeholder="Muscle group"
              placeholderTextColor="#6b6b6b"
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <TouchableOpacity onPress={saveName} style={{ backgroundColor: '#f2ca50', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 13 }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setName(ex.exercise_name); setMuscle(ex.muscle_group); setEditing(false); }} style={{ marginLeft: 8 }}>
              <X color="#6b6b6b" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 16 }}>{ex.exercise_name}</Text>
            <Text style={{ color: '#f2ca50', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
              {ex.muscle_group}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setEditing(true)} style={{ padding: 6, marginRight: 4 }}>
            <Pencil color="#6b6b6b" size={16} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(ex.id)} style={{ padding: 6 }}>
            <Trash2 color="#ef4444" size={16} />
          </TouchableOpacity>
        </View>
      )}

      {/* Sets & Reps editor */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: '#b3b3b3', flex: 1, fontSize: 13 }}>Sets</Text>
        <TextInput
          style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, width: 56, textAlign: 'center', fontSize: 15, fontWeight: '700' }}
          keyboardType="number-pad"
          value={ex.target_sets.toString()}
          onChangeText={val => onUpdateSetsReps(ex.id, 'target_sets', val)}
        />
        <Text style={{ color: '#b3b3b3', marginHorizontal: 16, fontSize: 13 }}>Reps</Text>
        <TextInput
          style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, width: 56, textAlign: 'center', fontSize: 15, fontWeight: '700' }}
          keyboardType="number-pad"
          value={ex.target_reps.toString()}
          onChangeText={val => onUpdateSetsReps(ex.id, 'target_reps', val)}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlanDetailScreen({ route, navigation }: any) {
  const { planId, planName } = route.params;
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('');

  const loadExercises = async () => {
    const rows = await db.getAllAsync<PlanExercise>(`
      SELECT 
        wpe.id, wpe.exercise_id, wpe.target_sets, wpe.target_reps, wpe.order_index,
        e.name as exercise_name, e.muscle_group
      FROM workout_plan_exercises wpe
      JOIN exercises e ON e.id = wpe.exercise_id
      WHERE wpe.workout_plan_id = ?
      ORDER BY wpe.order_index ASC
    `, [planId]);
    setExercises(rows);
  };

  useEffect(() => { loadExercises(); }, []);

  const getOrCreateExercise = async (name: string, muscle: string): Promise<number> => {
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM exercises WHERE name = ?', [name]);
    if (existing) return existing.id;
    const r = await db.runAsync('INSERT INTO exercises (name, muscle_group) VALUES (?, ?)', [name, muscle]);
    return r.lastInsertRowId;
  };

  const addExercise = async (name: string, muscle: string) => {
    const exerciseId = await getOrCreateExercise(name, muscle);
    // Avoid duplicates in this plan
    const dup = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM workout_plan_exercises WHERE workout_plan_id = ? AND exercise_id = ?',
      [planId, exerciseId]
    );
    if (dup) { setShowPicker(false); return; }

    await db.runAsync(
      'INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, target_sets, target_reps, order_index) VALUES (?,?,3,10,?)',
      [planId, exerciseId, exercises.length]
    );
    setCustomName(''); setCustomMuscle(''); setShowPicker(false);
    loadExercises();
  };

  const handleUpdateName = async (id: number, exerciseId: number, name: string, muscle: string) => {
    await db.runAsync('UPDATE exercises SET name = ?, muscle_group = ? WHERE id = ?', [name, muscle, exerciseId]);
    setExercises(prev => prev.map(e => e.id === id ? { ...e, exercise_name: name, muscle_group: muscle } : e));
  };

  const handleUpdateSetsReps = async (id: number, field: 'target_sets' | 'target_reps', value: string) => {
    const num = parseInt(value) || 0;
    await db.runAsync(`UPDATE workout_plan_exercises SET ${field} = ? WHERE id = ?`, [num, id]);
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: num } : e));
  };

  const handleDelete = (id: number) => {
    Alert.alert('Remove Exercise', 'Remove from this plan?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await db.runAsync('DELETE FROM workout_plan_exercises WHERE id = ?', [id]);
        loadExercises();
      }},
    ]);
  };

  const onDragEnd = async ({ data }: { data: PlanExercise[] }) => {
    setExercises(data);
    for (let i = 0; i < data.length; i++) {
      await db.runAsync('UPDATE workout_plan_exercises SET order_index = ? WHERE id = ?', [i, data[i].id]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#131313' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 14, backgroundColor: '#1c1b1b', borderBottomWidth: 1, borderBottomColor: '#2d2d2d', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
          <ArrowLeft color="#e5e2e1" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 22 }}>{planName}</Text>
          <Text style={{ color: '#b3b3b3', fontSize: 13, marginTop: 1 }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <DraggableFlatList
        data={exercises}
        keyExtractor={(item) => item.id.toString()}
        onDragEnd={onDragEnd}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, drag, isActive }: RenderItemParams<PlanExercise>) => (
          <ScaleDecorator>
            <ExerciseCard
              ex={item}
              onDelete={handleDelete}
              onUpdateName={handleUpdateName}
              onUpdateSetsReps={handleUpdateSetsReps}
              drag={drag}
              isActive={isActive}
            />
          </ScaleDecorator>
        )}
        ListEmptyComponent={
          exercises.length === 0 && !showPicker ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ color: '#6b6b6b', textAlign: 'center' }}>No exercises yet.{'\n'}Tap "+ Add Exercise" to build your plan.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <>
            {/* Add Exercise toggle */}
            <TouchableOpacity
              style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#2d2d2d', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center' }}
              onPress={() => setShowPicker(!showPicker)}
            >
              <Text style={{ color: '#b3b3b3', fontWeight: '600' }}>{showPicker ? '− Close' : '+ Add Exercise'}</Text>
            </TouchableOpacity>

            {/* Picker */}
            {showPicker && (
              <View style={{ backgroundColor: '#232323', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d2d', marginBottom: 32, overflow: 'hidden' }}>
                {/* Custom */}
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
          </>
        }
      />
    </View>
  );
}
