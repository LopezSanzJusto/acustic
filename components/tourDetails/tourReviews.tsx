// components/tourDetails/tourReviews.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';

export const TourReviews = () => (
  <View style={styles.container}>
    <Text style={styles.title}>¿Qué te ha parecido?</Text>
    <View style={styles.card}>
       <View style={styles.stars}>
         {[1,2,3,4,5].map(s => (
           <View key={s} style={styles.starCircle}>
             <Ionicons name="star" size={20} color={COLORS.white} />
           </View>
         ))}
       </View>
       <TouchableOpacity style={styles.button}>
         <Text style={styles.btnText}>Valora tu experiencia</Text>
       </TouchableOpacity>
       <Text style={styles.legal}>Gracias a tu ayuda podemos seguir mejorando el servicio.</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 100, marginTop: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
  card: { backgroundColor: '#F5F3FF', padding: 20, borderRadius: 20, alignItems: 'center' },
  stars: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  starCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#8B5CF6', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, marginBottom: 15, width: '100%', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  legal: { fontSize: 11, color: COLORS.muted, textAlign: 'center' }
});