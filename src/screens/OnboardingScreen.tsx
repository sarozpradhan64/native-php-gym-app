import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { useUserStore } from '../store/useUserStore';
import { Dumbbell } from 'lucide-react-native';

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const setProfile = useUserStore(state => state.setProfile);

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name to continue.');
      return;
    }

    const weightNum = parseFloat(weight) || null;
    const heightNum = parseFloat(height) || null;

    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO user_profile (id, name, birthday, weight, height) VALUES (1, ?, ?, ?, ?)',
        [name.trim(), birthday.trim() || null, weightNum, heightNum]
      );

      // Save initial weight to body measurements if provided
      if (weightNum) {
        await db.runAsync(
          'INSERT INTO body_measurements (weight_kg, notes) VALUES (?, ?)',
          [weightNum, 'Initial weight from onboarding']
        );
      }

      setProfile({
        name: name.trim(),
        birthday: birthday.trim() || null,
        weight: weightNum,
        height: heightNum,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#131313' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ backgroundColor: '#f2ca50', padding: 16, borderRadius: 24, marginBottom: 16 }}>
            <Dumbbell color="#3d2e00" size={48} strokeWidth={2.5} />
          </View>
          <Text style={{ color: '#e5e2e1', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
            Welcome to GymTracker
          </Text>
          <Text style={{ color: '#b3b3b3', fontSize: 16, textAlign: 'center' }}>
            Let's personalize your experience.
          </Text>
        </View>

        <View style={{ backgroundColor: '#1c1b1b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2d2d2d' }}>
          <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 1 }}>WHAT SHOULD WE CALL YOU? *</Text>
          <TextInput
            style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 20 }}
            placeholder="Your name"
            placeholderTextColor="#6b6b6b"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 1 }}>BIRTHDAY (OPTIONAL)</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 20 }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6b6b6b"
                value={birthday}
                editable={false}
              />
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthday ? new Date(birthday) : new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (event.type === 'set' && selectedDate) {
                  const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                  setBirthday(formattedDate);
                }
              }}
            />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 1 }}>WEIGHT (KG)</Text>
              <TextInput
                style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 10, padding: 14, fontSize: 16 }}
                placeholder="e.g. 75"
                placeholderTextColor="#6b6b6b"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 1 }}>HEIGHT (CM)</Text>
              <TextInput
                style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 10, padding: 14, fontSize: 16 }}
                placeholder="e.g. 180"
                placeholderTextColor="#6b6b6b"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={{ backgroundColor: '#f2ca50', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 }}
        >
          <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 18 }}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
