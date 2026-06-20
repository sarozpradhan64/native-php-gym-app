import { View, Text, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Trash2, ChevronRight } from 'lucide-react-native';

interface Plan {
  id: number;
  name: string;
  description: string;
  exercise_count: number;
}

export default function PlansScreen({ navigation }: any) {
  const db = useSQLiteContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  const loadPlans = async () => {
    const loaded = await db.getAllAsync<Plan>(`
      SELECT p.id, p.name, p.description,
        COUNT(wpe.id) as exercise_count
      FROM workout_plans p
      LEFT JOIN workout_plan_exercises wpe ON wpe.workout_plan_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);
    setPlans(loaded);
  };

  // Reload whenever this tab comes into focus (e.g. returning from PlanDetail)
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) return;
    await db.runAsync(
      'INSERT INTO workout_plans (name, description) VALUES (?, ?)',
      [newPlanName.trim(), newPlanDesc.trim()]
    );
    setNewPlanName('');
    setNewPlanDesc('');
    setIsAdding(false);
    loadPlans();
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Plan', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM workout_plans WHERE id = ?', [id]);
          loadPlans();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background p-4 pt-10">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-on-surface">Workout Plans</Text>
        <TouchableOpacity
          className="bg-primary w-10 h-10 rounded-full items-center justify-center"
          onPress={() => setIsAdding(!isAdding)}
        >
          <Plus color="#3d2e00" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Add Plan Form */}
      {isAdding && (
        <View className="bg-surface-container p-4 rounded-xl mb-5 border border-surface-bright">
          <Text className="text-on-surface font-bold mb-3 text-base">New Workout Plan</Text>
          <TextInput
            className="bg-surface-bright text-on-surface p-3 rounded-lg mb-3"
            placeholder="Plan Name (e.g. Push Day)"
            placeholderTextColor="#6b6b6b"
            value={newPlanName}
            onChangeText={setNewPlanName}
            returnKeyType="next"
            autoFocus
          />
          <TextInput
            className="bg-surface-bright text-on-surface p-3 rounded-lg mb-4"
            placeholder="Description (optional)"
            placeholderTextColor="#6b6b6b"
            value={newPlanDesc}
            onChangeText={setNewPlanDesc}
            returnKeyType="done"
            onSubmitEditing={handleAddPlan}
          />
          <View className="flex-row justify-end">
            <TouchableOpacity onPress={() => setIsAdding(false)} className="px-4 py-2 mr-2">
              <Text className="text-on-variant font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddPlan}
              className="bg-primary px-5 py-2 rounded-lg"
            >
              <Text className="text-on-primary font-bold">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={plans}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-on-variant text-center text-base">
              No plans yet.{'\n'}Tap the + button to create one.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-surface-container rounded-xl p-4 mb-3 border border-surface-bright flex-row items-center"
            onPress={() => navigation.navigate('PlanDetail', { planId: item.id, planName: item.name })}
            activeOpacity={0.7}
          >
            {/* Gold accent bar */}
            <View className="w-1 rounded-full bg-primary mr-3 self-stretch" />
            <View className="flex-1">
              <Text className="text-on-surface font-bold text-lg">{item.name}</Text>
              {item.description ? (
                <Text className="text-on-variant mt-0.5 text-sm">{item.description}</Text>
              ) : null}
              <Text className="text-primary text-xs font-semibold mt-1 uppercase tracking-widest">
                {item.exercise_count} exercise{item.exercise_count !== 1 ? 's' : ''}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                className="p-2 mr-1"
              >
                <Trash2 color="#6b6b6b" size={18} />
              </TouchableOpacity>
              <ChevronRight color="#6b6b6b" size={20} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
