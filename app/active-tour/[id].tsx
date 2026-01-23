// app/active-tour/[id].tsx
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreenContent from '../../screens/homeScreen.native'; // Reutilizamos tu lógica

export default function ActiveTourPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Botón para cerrar la ruta y volver al detalle */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Renderizamos tu componente de Mapa pasando el ID dinámico */}
      <HomeScreenContent tourId={id as string} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8
  }
});