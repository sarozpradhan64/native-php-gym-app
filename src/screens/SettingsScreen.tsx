import { View, Text, ScrollView, Switch, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import { Moon, Bell, Info, Trash2, User, X } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from 'react-native';
import { useUserStore } from '../store/useUserStore';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { profile, setProfile } = useUserStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Edit Profile State
  const [editName, setEditName] = useState(profile?.name || '');
  const [editBirthday, setEditBirthday] = useState(profile?.birthday || '');
  const [editWeight, setEditWeight] = useState(profile?.weight?.toString() || '');
  const [editHeight, setEditHeight] = useState(profile?.height?.toString() || '');

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

      // If weight changed, we could log it, but for simplicity we just update the profile
      setProfile({
        name: editName.trim(),
        birthday: editBirthday.trim() || null,
        weight: weightNum,
        height: heightNum,
      });

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
  }: {
    icon: React.ReactNode;
    label: string;
    right: React.ReactNode;
    onPress?: () => void;
  }) => {
    const content = (
      <>
        <View className="w-8 items-center mr-3">{icon}</View>
        <Text className="text-on-surface font-medium flex-1">{label}</Text>
        {right}
      </>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} className="flex-row items-center px-4 py-4 border-b border-surface-bright">
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View className="flex-row items-center px-4 py-4 border-b border-surface-bright">
        {content}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#131313' }}>
      <ScrollView contentContainerClassName="pt-10 pb-20">
        <Text className="text-3xl font-bold text-on-surface px-4 mb-6">Settings</Text>

        {/* Profile */}
        <Text className="text-on-variant text-xs font-semibold uppercase tracking-widest px-4 mb-2">
          Profile
        </Text>
        <View className="bg-surface-container rounded-xl border border-surface-bright mx-4 mb-6 overflow-hidden">
          <Row
            icon={<User color="#f2ca50" size={20} />}
            label="Name"
            right={<Text className="text-on-variant">{profile?.name || 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
          <Row
            icon={<View />} // empty icon placeholder
            label="Birthday"
            right={<Text className="text-on-variant">{profile?.birthday || 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
          <Row
            icon={<View />}
            label="Weight"
            right={<Text className="text-on-variant">{profile?.weight ? `${profile.weight} kg` : 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
          <Row
            icon={<View />}
            label="Height"
            right={<Text className="text-on-variant">{profile?.height ? `${profile.height} cm` : 'Not set'}</Text>}
            onPress={() => setShowEditProfile(true)}
          />
        </View>

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

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1c1b1b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#2d2d2d' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 20 }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <X color="#6b6b6b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>NAME</Text>
            <TextInput
              style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16 }}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>BIRTHDAY</Text>
            <TextInput
              style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16 }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6b6b6b"
              value={editBirthday}
              onChangeText={setEditBirthday}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>WEIGHT (KG)</Text>
                <TextInput
                  style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 24 }}
                  keyboardType="numeric"
                  value={editWeight}
                  onChangeText={setEditWeight}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>HEIGHT (CM)</Text>
                <TextInput
                  style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 24 }}
                  keyboardType="numeric"
                  value={editHeight}
                  onChangeText={setEditHeight}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={{ backgroundColor: '#f2ca50', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
