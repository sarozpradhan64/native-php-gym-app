import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { View, ActivityIndicator, Text } from 'react-native';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/db';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#131313', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            Database Error
          </Text>
          <Text style={{ color: '#b3b3b3', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <Text style={{ color: '#e5e2e1', fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
            If you are using Expo Web, this often happens during Fast Refresh because the previous database connection wasn't fully closed.
          </Text>
          <Text style={{ color: '#f2ca50', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
            Please reload the page (F5 or Cmd+R) to continue.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#131313', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#f2ca50" size="large" />
      </View>
    );
  }

  // Set default font globally
  const { Text, TextInput } = require('react-native');
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = [{ fontFamily: 'NunitoSans_400Regular' }, Text.defaultProps.style];
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = [{ fontFamily: 'NunitoSans_400Regular' }, TextInput.defaultProps.style];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SQLiteProvider databaseName="gymtracker.db" onInit={initializeDatabase}>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </SQLiteProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
