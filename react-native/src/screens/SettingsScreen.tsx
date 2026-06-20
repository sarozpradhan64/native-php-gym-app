import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Moon, Bell, Info, Trash2 } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from 'react-native';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all workout history, plans, and progress. This cannot be undone.',
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
            `);
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const Row = ({
    icon,
    label,
    right,
  }: {
    icon: React.ReactNode;
    label: string;
    right: React.ReactNode;
  }) => (
    <View className="flex-row items-center px-4 py-4 border-b border-surface-bright">
      <View className="w-8 items-center mr-3">{icon}</View>
      <Text className="text-on-surface font-medium flex-1">{label}</Text>
      {right}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pt-10 pb-20">
      <Text className="text-3xl font-bold text-on-surface px-4 mb-6">Settings</Text>

      {/* Preferences */}
      <Text className="text-on-variant text-xs font-semibold uppercase tracking-widest px-4 mb-2">
        Preferences
      </Text>
      <View className="bg-surface-container rounded-xl border border-surface-bright mx-4 mb-6 overflow-hidden">
        <Row
          icon={<Bell color="#f2ca50" size={20} />}
          label="Workout Reminders"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#2d2d2d', true: '#f2ca50' }}
              thumbColor={notificationsEnabled ? '#3d2e00' : '#b3b3b3'}
            />
          }
        />
        <Row
          icon={<Moon color="#f2ca50" size={20} />}
          label="Rest Timer Sound"
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

      {/* About */}
      <Text className="text-on-variant text-xs font-semibold uppercase tracking-widest px-4 mb-2">
        About
      </Text>
      <View className="bg-surface-container rounded-xl border border-surface-bright mx-4 mb-6 overflow-hidden">
        <Row
          icon={<Info color="#b3b3b3" size={20} />}
          label="GymTracker"
          right={<Text className="text-on-variant">v1.0.0</Text>}
        />
      </View>

      {/* Danger Zone */}
      <Text className="text-on-variant text-xs font-semibold uppercase tracking-widest px-4 mb-2">
        Danger Zone
      </Text>
      <View className="mx-4">
        <TouchableOpacity
          className="bg-surface-container border border-red-900/50 rounded-xl px-4 py-4 flex-row items-center"
          onPress={handleClearData}
        >
          <Trash2 color="#ef4444" size={20} />
          <Text className="text-red-400 font-semibold ml-3">Clear All Workout Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
