import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="play"
        options={{
          href:"/(tabs)/play",
          title: 'Jouer',
          tabBarIcon: ({ color }) => <FontAwesome6 name="dice" size={24} color={color} />,
        }}
      />      
      <Tabs.Screen
        name='index'
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}
