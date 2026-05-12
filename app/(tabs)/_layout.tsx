// app/(tabs)/_layout.tsx  

import { Tabs } from 'expo-router';
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
          tabBarIcon: ({ focused, color }) => focused
            ? <Image source={require('../../assets/images/icons/Explora_Relleno.png')} style={{ width: 30, height: 30, tintColor: color  }} resizeMode="contain" />
            : <Image source={require('../../assets/images/icons/Explora.png')} style={{ width: 22, height: 22, tintColor: color }} resizeMode="contain" />,
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
                width: 31,
                height: 31,
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
          tabBarIcon: ({ focused, color }) => focused
            ? <Image source={require('../../assets/images/icons/Perfil_Relleno.png')} style={{ width: 24.8, height: 24.8}} resizeMode="contain" />
            : <Image source={require('../../assets/images/icons/Perfil.png')} style={{ width: 28.5, height: 28.5, tintColor: color }} resizeMode="contain" />,
        }}
      />
    </Tabs>
  );
}