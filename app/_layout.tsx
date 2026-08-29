import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite'

import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  async function initDB(db: SQLiteDatabase) {
    const result = await db.getFirstAsync<{user_version:number}>('PRAGMA user_version');
    const currentVersion = result?.user_version || 0;
    if (currentVersion < 1) {
      await db.execAsync(`                     
        CREATE TABLE IF NOT EXISTS games(
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL CHECK (status IN ('completed', 'ongoing')),
          mode TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          duration INTEGER,
          game_state TEXT NOT NULL, -- json
          rules TEXT NOT NULL -- JSON
        );
      `); 
    }
  }

  return (
    <SQLiteProvider databaseName='farkle' onInit={initDB}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
                name="game"
                options={{
                    headerShown: false,
                    navigationBarHidden:true
                }}
            />
      </Stack>
      <StatusBar style="auto" />
      </ThemeProvider>
      </SQLiteProvider>
  );
}
