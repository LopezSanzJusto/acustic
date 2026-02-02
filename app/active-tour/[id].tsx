// app/active-tour/[id].tsx

import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import HomeScreenContent from '../../screens/activeRouteScreen'; 
// ✅ Importamos el nuevo componente
import { FloatingButton } from '../../components/floatingButton';

export default function ActiveTourPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ✅ USO DEL COMPONENTE: Botón Cerrar (X) */}
      <FloatingButton 
        icon="close" 
        size={28} // Podemos hacerlo un poco más grande si queremos
        onPress={() => router.back()}
        style={{ top: 50, right: 20 }} // A la derecha
      />

      {/* Renderizamos tu componente de Mapa pasando el ID dinámico */}
      <HomeScreenContent tourId={id as string} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 🗑️ ELIMINADO: closeButton (ya no se usa)
});