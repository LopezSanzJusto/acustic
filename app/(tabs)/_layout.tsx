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
          tabBarIcon: ({ color, focused }) => focused
            ? <Ionicons name="map" size={24} color={color} />
            : <Image source={require('../../assets/images/icons/Explora.png')} style={{ width: 30, height: 26, tintColor: color }} resizeMode="contain" />,
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
                width: 36,
                height: 36,
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
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/icons/Perfil.png')}
              style={{ width: 32, height: 32, filter: focused ? [] : [{ grayscale: 1 }] } as any}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}