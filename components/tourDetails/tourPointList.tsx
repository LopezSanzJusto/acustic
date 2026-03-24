import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { PointOfInterest } from '../../data/points';
import { useCustomRoute } from '../../hooks/useCustomRoute';

export const TourPointList = ({ points }: { points: PointOfInterest[] }) => {
  const { customPoints, setInitialPoints, togglePointVisibility } = useCustomRoute();

  useEffect(() => {
    if (points && points.length > 0) {
      setInitialPoints(points);
    }
  }, [points, setInitialPoints]);

  if (customPoints.length === 0) return null;

  // ✨ ESTA ES LA CLAVE: Un contador que solo sube para los puntos visibles
  let visibleCounter = 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Personaliza tu ruta</Text>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>Mantén pulsado para reordenar o toca el ojo para ocultar paradas.</Text>
      </View>

      {customPoints.map((point) => {
        // Si el punto está visible, sumamos 1 al contador
        if (!point.isHidden) {
          visibleCounter++;
        }

        return (
          <View 
            key={point.id} 
            style={[styles.row, point.isHidden && styles.rowHidden]}
          >
            <Image 
              source={{ uri: point.image }} 
              style={[styles.image, point.isHidden && styles.imageHidden]} 
            />
            
            {/* ✨ CONTENEDOR DE TEXTO CENTRADO */}
            <View style={styles.textContainer}>
              <Text style={[styles.pointName, point.isHidden && styles.textHidden]} numberOfLines={2}>
                {/* Si está oculto, no mostramos número. Si está visible, usamos el contador */}
                {!point.isHidden ? `${visibleCounter}. ` : ''}{point.name}
              </Text>
            </View>

            {/* Botón del Ojo */}
            <TouchableOpacity 
              onPress={() => togglePointVisibility(point.id)}
              style={styles.iconButton}
            >
               <Ionicons 
                 name={point.isHidden ? "eye-off-outline" : "eye-outline"} 
                 size={24} 
                 color={point.isHidden ? COLORS.muted : COLORS.textDark} 
               />
            </TouchableOpacity>

            {/* Icono de arrastrar */}
            <View style={styles.dragHandle}>
               <Ionicons name="menu-outline" size={24} color={COLORS.muted} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  header: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F3E8FF', padding: 12, borderRadius: 12, marginBottom: 15, alignItems: 'center', gap: 10 },
  infoText: { fontSize: 12, color: COLORS.primary, flex: 1, lineHeight: 18 },
  row: { 
    flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10,
    backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border 
  },
  rowHidden: { backgroundColor: '#f9f9f9', borderColor: '#eaeaea' },
  image: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  imageHidden: { opacity: 0.5 },
  
  // ✨ ESTILOS ACTUALIZADOS PARA EL CENTRADO
  textContainer: { 
    flex: 1, 
    justifyContent: 'center', // Esto lo centra verticalmente
  },
  pointName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.textDark,
    // Eliminado el marginBottom para que quede justo en el medio
  },
  textHidden: { color: COLORS.muted, textDecorationLine: 'line-through' },
  iconButton: { padding: 5, marginRight: 5 },
  dragHandle: { padding: 5 }
});