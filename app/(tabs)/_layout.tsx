// app/(tabs)/_layout.tsx  

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: COLORS.primary, 
      headerShown: false,
      tabBarStyle: { height: 60, paddingBottom: 10, backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 0, shadowOpacity: 0 }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explora',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Mis audioguías',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ 
                width: 32,
                height: 32,
                tintColor: color // 💡 El color cambiará automáticamente según esté activo o inactivo
              }} 
              resizeMode="contain" 
            />
          ),        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}