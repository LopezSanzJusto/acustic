// components/creator/PointCard.tsx
//
// Card de una parada en la pantalla 2 del wizard ("Panel de creador").
// Muestra thumbnail con badge numérico, título, descripción corta y un
// botón papelera (rojo) que aparece cuando NO estamos en modo arrastrar.
// En modo arrastrar, en lugar de papelera mostramos un icono de "grip"
// para indicar que se puede mantener pulsado para reordenar.

import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/utils/theme';
import type { TourPoint } from '@/types/tour';

interface PointCardProps {
  point: TourPoint;
  /** Posición visible (1-based). No leemos `point.order` porque puede
   *  estar desincronizado durante un drag. */
  index: number;
  onPress: () => void;
  onDelete: () => void;
  /** Modo "Modificar" activo: cambia el handler derecho a un grip y
   *  habilita el long-press para arrastrar (gestionado por el padre). */
  editing?: boolean;
  /** Listeners para drag&drop, los inyecta DraggableFlatList. */
  onLongPress?: () => void;
  isActive?: boolean;
}

export const PointCard = memo(function PointCard({
  point,
  index,
  onPress,
  onDelete,
  editing = false,
  onLongPress,
  isActive = false,
}: PointCardProps) {
  const hasImage = !!point.imageUrl;
  const hasName = !!point.name?.trim();
  const title = hasName ? point.name : 'Título';
  const subtitle = point.description?.trim()
    ? point.description
    : 'Información';
  // En la primera parada el badge es morado; en las siguientes, gris.
  // Esto coincide con el Figma: la primera "destaca" como punto inicial.
  const badgeColor = index === 1 ? COLORS.primary : '#9E9E9E';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isActive}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        pressed && !isActive && { opacity: 0.85 },
      ]}
    >
      <View style={styles.imageWrapper}>
        {hasImage ? (
          <Image source={{ uri: point.imageUrl! }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={22} color={COLORS.placeholder} />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{index}</Text>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[styles.title, !hasName && styles.titlePlaceholder]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {editing ? (
        <View style={styles.gripBtn}>
          <Ionicons name="reorder-three" size={26} color={COLORS.primary} />
        </View>
      ) : (
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="trash" size={16} color={COLORS.white} />
        </Pressable>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#8874F780',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    marginBottom: 12,
  },
  cardActive: {
    // Mientras se arrastra: ligero realce y sombra.
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 22,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundAlt,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  titlePlaceholder: {
    color: COLORS.placeholder,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#4E4FA580',
    fontStyle: 'italic',
    marginTop: 1,
  },
  trashBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  gripBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
