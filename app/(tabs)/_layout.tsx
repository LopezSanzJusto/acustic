import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#4B0082', // Color púrpura de tu diseño
      headerShown: false,
      tabBarStyle: { height: 60, paddingBottom: 10 } 
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explora',
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Mis viajes',
          tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}