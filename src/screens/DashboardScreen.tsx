import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionStore } from '../store/useSessionStore';
import { useUserStore } from '../store/useUserStore';
import { Flame, Zap, ChevronRight, Calendar, Dumbbell } from 'lucide-react-native';

interface RecentSession {
  id: number;
  plan_name: string | null;
  started_at: string;
  duration: number | null;
  set_count: number;
}

interface Plan {
  id: number;
  name: string;
}

function calculateStreak(sessions: { completed_at: string }[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDays = [
    ...new Set(
      sessions
        .filter(s => s.completed_at)
        .map(s => new Date(s.completed_at).toDateString())
    ),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDays.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  let expected = new Date(today);
  expected.setHours(0, 0, 0, 0);

  for (const dayStr of uniqueDays) {
    const day = new Date(dayStr);
    const diff = Math.round(
      (expected.getTime() - day.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0 || diff === 1) {
      streak++;
      expected = new Date(day);
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function DashboardScreen({ navigation }: any) {
  const db = useSQLiteContext();
  const startSession = useSessionStore(state => state.startSession);
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const profile = useUserStore(state => state.profile);

  const [streak, setStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [weekCount, setWeekCount] = useState(0);

  const loadData = async () => {
    // Recent sessions
    const sessions = await db.getAllAsync<RecentSession>(`
      SELECT 
        s.id, s.started_at, s.completed_at, s.duration,
        p.name as plan_name,
        COUNT(e.id) as set_count
      FROM workout_sessions s
      LEFT JOIN workout_plans p ON s.workout_plan_id = p.id
      LEFT JOIN workout_session_exercises e ON e.workout_session_id = s.id
      WHERE s.completed_at IS NOT NULL
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT 5
    `);
    setRecentSessions(sessions);

    // All sessions for streak
    const allSessions = await db.getAllAsync<{ completed_at: string }>(
      'SELECT completed_at FROM workout_sessions WHERE completed_at IS NOT NULL ORDER BY completed_at DESC'
    );
    setStreak(calculateStreak(allSessions));

    // This week's count
    const week = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM workout_sessions
      WHERE completed_at IS NOT NULL
        AND completed_at >= date('now', 'weekday 0', '-7 days')
    `);
    setWeekCount(week?.count ?? 0);

    // Plans for quick start
    const loadedPlans = await db.getAllAsync<Plan>(
      'SELECT id, name FROM workout_plans ORDER BY id DESC LIMIT 4'
    );
    setPlans(loadedPlans);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleQuickStart = async () => {
    const result = await db.runAsync(
      'INSERT INTO workout_sessions (started_at) VALUES (CURRENT_TIMESTAMP)'
    );
    startSession(result.lastInsertRowId);
    navigation.navigate('ActiveSession');
  };

  const handleStartFromPlan = async (plan: Plan) => {
    const result = await db.runAsync(
      'INSERT INTO workout_sessions (workout_plan_id, started_at) VALUES (?, CURRENT_TIMESTAMP)',
      [plan.id]
    );
    startSession(result.lastInsertRowId);
    navigation.navigate('ActiveSession');
  };

  const formatDuration = (secs: number | null) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    return `${m} min`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingTop: 40, paddingBottom: 80 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-bold text-on-surface">GymTracker</Text>
          <Text className="text-sm text-on-variant mt-0.5">Let's get to work, {profile?.name ? profile.name.split(' ')[0] : 'Athlete'} 💪</Text>
        </View>
        <View className="items-center bg-surface-container border border-surface-bright rounded-2xl px-4 py-2">
          <Flame color="#f2ca50" size={18} />
          <Text className="text-primary font-bold text-lg leading-tight">{streak}</Text>
          <Text className="text-on-variant text-xs">streak</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row mb-6">
        <View className="flex-1 bg-surface-container rounded-xl p-4 border border-surface-bright mr-3 items-center justify-center">
          <Text className="text-2xl font-bold text-on-surface">{weekCount}</Text>
          <Text className="text-on-variant text-xs mt-1">This Week</Text>
        </View>
        <View className="flex-1 bg-surface-container rounded-xl p-4 border border-surface-bright items-center justify-center">
          <Text className="text-2xl font-bold text-on-surface">{streak}</Text>
          <Text className="text-on-variant text-xs mt-1">Day Streak</Text>
        </View>
      </View>

      {/* Active session banner */}
      {activeSessionId !== null && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ActiveSession')}
          style={{ backgroundColor: 'rgba(242,202,80,0.15)', borderWidth: 1, borderColor: '#f2ca50' }}
          className="rounded-xl p-4 mb-5 flex-row items-center"
        >
          <Zap color="#f2ca50" size={20} />
          <Text className="text-primary font-bold ml-2 flex-1">Session in Progress — Tap to Continue</Text>
          <ChevronRight color="#f2ca50" size={20} />
        </TouchableOpacity>
      )}

      {/* Quick Start */}
      <View
        style={{ backgroundColor: '#232323', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#2d2d2d', overflow: 'hidden' }}
      >
        <Text className="text-xl font-bold text-on-surface mb-1">Ready to train?</Text>
        <Text className="text-on-variant mb-4 text-sm">Start empty or pick a plan below.</Text>
        <TouchableOpacity
          onPress={handleQuickStart}
          style={{ backgroundColor: '#f2ca50', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>⚡ Quick Start</Text>
        </TouchableOpacity>
      </View>

      {/* Start from Plan */}
      {plans.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Dumbbell color="#f2ca50" size={16} />
            <Text className="text-on-surface font-bold text-base ml-2">Start from Plan</Text>
          </View>
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => handleStartFromPlan(plan)}
              className="bg-surface-container border border-surface-bright rounded-xl px-4 py-3 mb-2 flex-row items-center"
            >
              <View className="w-1.5 self-stretch bg-primary rounded-full mr-3" />
              <Text className="text-on-surface font-medium flex-1">{plan.name}</Text>
              <ChevronRight color="#6b6b6b" size={18} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent History */}
      <View className="flex-row items-center mb-3">
        <Calendar color="#f2ca50" size={16} />
        <Text className="text-on-surface font-bold text-base ml-2">Recent Workouts</Text>
      </View>
      {recentSessions.length === 0 ? (
        <View className="items-center py-8 bg-surface-container rounded-xl border border-surface-bright">
          <Text className="text-on-variant text-sm">No completed workouts yet.</Text>
        </View>
      ) : (
        recentSessions.map(session => (
          <View
            key={session.id}
            className="bg-surface-container rounded-xl px-4 py-3 mb-2 border border-surface-bright flex-row justify-between items-center"
          >
            <View>
              <Text className="text-on-surface font-semibold">
                {session.plan_name ?? 'Freestyle Workout'}
              </Text>
              <Text className="text-on-variant text-xs mt-0.5">{formatDate(session.started_at)}</Text>
            </View>
            <View className="items-end">
              {formatDuration(session.duration) && (
                <Text className="text-primary font-bold text-sm">{formatDuration(session.duration)}</Text>
              )}
              <Text className="text-on-variant text-xs">{session.set_count} sets</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
