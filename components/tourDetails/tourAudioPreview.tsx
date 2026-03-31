// components/tourDetails/tourAudioPreview.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import { PointOfInterest } from '../../data/points';
import { useAudio } from '../../hooks/useAudio'; // ✨ Importamos tu hook de audio

// Habilitar animaciones de Layout en Android (necesario para LayoutAnimation)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TourAudioPreviewProps {
  points: PointOfInterest[];
  price: number; // ✨ Mantenemos la prop por si la necesitas en el futuro, aunque ya no afectará al bloqueo
}

export const TourAudioPreview = ({ points, price }: TourAudioPreviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ✨ Inicializamos el hook de audio con los puntos
  const { 
    activePoint, 
    isPlaying, 
    setActivePointIndex, 
    togglePlayPause 
  } = useAudio(points);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  if (!points || points.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Botón Principal */}
      <TouchableOpacity style={styles.previewButton} onPress={toggleExpand} activeOpacity={0.8}>
         <Ionicons name="headset" size={20} color="white" style={{ marginRight: 8 }} />
         <Text style={styles.previewText}>Previsualización de la ruta</Text>
         <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="white" 
            style={styles.chevronIcon} 
         />
      </TouchableOpacity>

      {/* Lista Desplegable */}
      {isExpanded && (
        <View style={styles.dropdownContainer}>
          {points.map((point, index) => {
            // ✨ LÓGICA CORE ACTUALIZADA: 
            // Ahora TODAS las rutas se bloquean a partir del 3er audio (index >= 2)
            // Ya no diferenciamos entre isFreeTour o pago para esta regla.
            const isLocked = index >= 2; 
            
            // Comprobamos si este punto es el que está sonando ahora mismo
            const isCurrentPoint = activePoint?.id === point.id;

            // Determinamos qué icono mostrar
            let iconName: any = "play-circle";
            if (isLocked) {
              iconName = "lock-closed";
            } else if (isCurrentPoint && isPlaying) {
              iconName = "pause-circle";
            }

            return (
              <View key={point.id || index} style={styles.audioRow}>
                <View style={styles.audioInfo}>
                  <Text 
                    style={[styles.audioTitle, isLocked && styles.textLocked]} 
                    numberOfLines={1}
                  >
                    {index + 1}. {point.name || `Punto ${index + 1}`}
                  </Text>
                  
                  {/* ✨ TEXTOS ACTUALIZADOS: Adaptados para que tengan sentido en gratis y pago */}
                  <Text style={[styles.audioStatus, !isLocked && styles.textFree]}>
                    {isLocked ? "Disponible al iniciar la ruta" : "Muestra de audio"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  disabled={isLocked}
                  onPress={() => {
                    // ✨ LÓGICA DE REPRODUCCIÓN
                    if (isCurrentPoint) {
                      // Si ya es el audio actual, lo pausamos o reanudamos
                      togglePlayPause();
                    } else {
                      // Si es un audio diferente, cambiamos el índice para que empiece a sonar
                      setActivePointIndex(index);
                    }
                  }}
                >
                  <Ionicons
                    name={iconName}
                    size={32}
                    color={isLocked ? COLORS.muted : COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  previewButton: {
    backgroundColor: '#8B5CF6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, borderRadius: 12, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 5, zIndex: 2,
  },
  previewText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  chevronIcon: { position: 'absolute', right: 20 },
  dropdownContainer: {
    backgroundColor: COLORS.surface, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    paddingTop: 20, paddingBottom: 10, paddingHorizontal: 15, marginTop: -10, borderWidth: 1,
    borderColor: COLORS.border, borderTopWidth: 0,
  },
  audioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  audioInfo: { flex: 1, paddingRight: 10 },
  audioTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  textLocked: { color: COLORS.muted },
  audioStatus: { fontSize: 12, color: COLORS.muted },
  textFree: { color: COLORS.primary, fontWeight: '500' },
  actionButton: { padding: 4 }
});