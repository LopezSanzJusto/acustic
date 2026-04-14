// app/active-tour/[id].tsx

import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import HomeScreenContent from '../../screens/activeRouteScreen'; 
import { FloatingButton } from '../../components/floatingButton';
// Importamos esto para bajar el botón dinámicamente según el móvil
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActiveTourPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Renderizamos el Mapa primero para que quede debajo */}
      <HomeScreenContent tourId={id as string} />

      {/* ✨ AJUSTADO: Botón Cerrar (X) movido un poco más abajo */}
      <FloatingButton 
        icon="close" 
        size={26}
        onPress={() => router.back()}
        style={{ 
          position: 'absolute', // Aseguramos que es flotante
          top: insets.top + 100, // Lo bajamos para que quede bajo la barra de progreso
          right: 15,
          zIndex: 999 
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
});