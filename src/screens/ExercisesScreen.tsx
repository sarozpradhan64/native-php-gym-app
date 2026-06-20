import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { Plus, X, Trash2, Dumbbell, Link, Image as ImageIcon } from 'lucide-react-native';

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  local_image_uri: string | null;
}

export default function ExercisesScreen() {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const loadExercises = async () => {
    const rows = await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY name ASC');
    setExercises(rows);
  };

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [])
  );

  const resetForm = () => {
    setName('');
    setMuscleGroup('');
    setImageUrl('');
    setShowAddModal(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !muscleGroup.trim()) {
      Alert.alert('Missing Info', 'Please provide an exercise name and muscle group.');
      return;
    }

    let localUri: string | null = null;

    if (imageUrl.trim()) {
      setIsDownloading(true);
      try {
        // Create a unique filename using timestamp
        const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1).split('?')[0] || `exercise_${Date.now()}.gif`;
        const fileUri = `${FileSystem.documentDirectory}${Date.now()}_${filename}`;
        
        const downloadResult = await FileSystem.downloadAsync(imageUrl.trim(), fileUri);
        
        if (downloadResult.status === 200) {
          localUri = downloadResult.uri;
        } else {
          Alert.alert('Download Failed', 'Could not download the image. The URL might be invalid or protected.');
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to download the image from the provided URL.');
        console.error(e);
      } finally {
        setIsDownloading(false);
      }
    }

    await db.runAsync(
      'INSERT INTO exercises (name, muscle_group, local_image_uri) VALUES (?, ?, ?)',
      [name.trim(), muscleGroup.trim(), localUri]
    );

    resetForm();
    loadExercises();
  };

  const handleDelete = (id: number, exerciseName: string, imageUri: string | null) => {
    Alert.alert('Delete Exercise', `Remove "${exerciseName}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
          
          // Clean up the local file if it exists
          if (imageUri) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(imageUri);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(imageUri);
              }
            } catch (e) {
              console.error('Failed to delete local image file', e);
            }
          }
          
          loadExercises();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#131313' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 14, backgroundColor: '#1c1b1b', borderBottomWidth: 1, borderBottomColor: '#2d2d2d', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 26 }}>Library</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#f2ca50', w: 40, h: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 8 }}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#3d2e00" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 80 }}>
        {exercises.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, backgroundColor: '#232323', borderRadius: 12, borderWidth: 1, borderColor: '#2d2d2d', borderStyle: 'dashed' }}>
            <Dumbbell color="#6b6b6b" size={32} style={{ marginBottom: 12 }} />
            <Text style={{ color: '#6b6b6b', textAlign: 'center' }}>No custom exercises yet.{'\n'}Tap the + button to add one.</Text>
          </View>
        ) : (
          exercises.map(ex => (
            <View key={ex.id} style={{ backgroundColor: '#232323', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2d2d2d', overflow: 'hidden' }}>
              {ex.local_image_uri ? (
                <View style={{ backgroundColor: '#1c1b1b', height: 160, width: '100%', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
                  <Image source={{ uri: ex.local_image_uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
              ) : (
                <View style={{ backgroundColor: '#1c1b1b', height: 60, width: '100%', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#2d2d2d' }}>
                  <ImageIcon color="#2d2d2d" size={32} />
                </View>
              )}
              <View style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 16 }}>{ex.name}</Text>
                  <Text style={{ color: '#f2ca50', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                    {ex.muscle_group}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(ex.id, ex.name, ex.local_image_uri)} style={{ padding: 8 }}>
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal transparent visible={showAddModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1c1b1b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#2d2d2d' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#e5e2e1', fontWeight: 'bold', fontSize: 20 }}>Add Exercise</Text>
              <TouchableOpacity onPress={resetForm}>
                <X color="#6b6b6b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>EXERCISE NAME</Text>
            <TextInput
              style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16 }}
              placeholder="e.g. Barbell Squat"
              placeholderTextColor="#6b6b6b"
              value={name}
              onChangeText={setName}
            />

            <Text style={{ color: '#b3b3b3', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>MUSCLE GROUP</Text>
            <TextInput
              style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 16 }}
              placeholder="e.g. Legs"
              placeholderTextColor="#6b6b6b"
              value={muscleGroup}
              onChangeText={setMuscleGroup}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Link color="#b3b3b3" size={14} style={{ marginRight: 6 }} />
              <Text style={{ color: '#b3b3b3', fontSize: 12, fontWeight: '600' }}>GIF OR IMAGE URL (OPTIONAL)</Text>
            </View>
            <TextInput
              style={{ backgroundColor: '#2d2d2d', color: '#e5e2e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 24 }}
              placeholder="https://example.com/squat.gif"
              placeholderTextColor="#6b6b6b"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={isDownloading}
              style={{ backgroundColor: isDownloading ? '#b3b3b3' : '#f2ca50', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              {isDownloading ? (
                <>
                  <ActivityIndicator color="#3d2e00" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>Downloading & Saving...</Text>
                </>
              ) : (
                <Text style={{ color: '#3d2e00', fontWeight: 'bold', fontSize: 16 }}>Save to Library</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
