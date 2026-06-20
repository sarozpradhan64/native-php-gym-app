import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/db';

export default function App() {
  return (
    <SQLiteProvider databaseName="gymtracker.db" onInit={initializeDatabase}>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SQLiteProvider>
  );
}
