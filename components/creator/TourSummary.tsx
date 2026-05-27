// components/creator/TourSummary.tsx
//
// Resumen del tour mostrado en la pantalla 3 del wizard, justo antes
// del botón "Publicar". Lee el draft + los points desde el CreatorContext.
//
//   - Línea 1: portada en miniatura + título + destino.
//   - Línea 2: chips con categoría, nº de paradas y distancia estimada.
//   - Lista de validación con los problemas que impedirán publicar
//     (delegamos en `validateForPublish` del servicio para mantener un
//     único punto de verdad).

import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreator } from '@/contexts/CreatorContext';
import { validateForPublish } from '@/services/creatorService';
import { getCategoryLabel } from '@/constants/categories';
import { getDistanceInMeters } from '@/utils/geo';
import { COLORS, FONTS } from '@/utils/theme';

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10_000 ? 0 : 1)} km`;
}

export interface TourSummaryProps {
  /** Mostrar la lista de validaciones pendientes (errores).
   *  Útil en la pantalla de publicar; en otras vistas no hace falta. */
  showValidation?: boolean;
}

export function TourSummary({ showValidation = true }: TourSummaryProps) {
  const { draft, points } = useCreator();

  // Distancia estimada con haversine sumando segmentos consecutivos.
  // Coincide con `calculateTotalDistance` del servicio, pero ese es
  // privado del módulo — replicamos la lógica simple aquí para no
  // exportarlo sólo para esta vista.
  const estimatedMeters = useMemo(() => {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (
        typeof a.latitude === 'number' && typeof a.longitude === 'number' &&
        typeof b.latitude === 'number' && typeof b.longitude === 'number' &&
        !(a.latitude === 0 && a.longitude === 0) &&
        !(b.latitude === 0 && b.longitude === 0)
      ) {
        total += getDistanceInMeters(a.latitude, a.longitude, b.latitude, b.longitude);
      }
    }
    return total;
  }, [points]);

  const validationErrors = useMemo(() => {
    if (!draft) return [];
    return validateForPublish(draft, points);
  }, [draft, points]);

  if (!draft) return null;

  const destination =
    (draft.destination && draft.destination.trim()) ||
    [draft.city, draft.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      {/* ─── Encabezado: portada + título + destino ─── */}
      <View style={styles.header}>
        {draft.coverImageUrl ? (
          <Image source={{ uri: draft.coverImageUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="image-outline" size={22} color={COLORS.placeholder} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {draft.title?.trim() || 'Sin título'}
          </Text>
          {!!destination && (
            <Text style={styles.destination} numberOfLines={1}>
              <Ionicons name="location-outline" size={12} color={COLORS.muted} />
              {' '}{destination}
            </Text>
          )}
        </View>
      </View>

      {/* ─── Chips: categoría, paradas, distancia ─── */}
      <View style={styles.chipsRow}>
        {draft.category && (
          <View style={styles.chip}>
            <Ionicons name="pricetag-outline" size={12} color={COLORS.primary} />
            <Text style={styles.chipText}>{getCategoryLabel(draft.category)}</Text>
          </View>
        )}
        <View style={styles.chip}>
          <Ionicons name="flag-outline" size={12} color={COLORS.primary} />
          <Text style={styles.chipText}>
            {points.length} {points.length === 1 ? 'parada' : 'paradas'}
          </Text>
        </View>
        {estimatedMeters > 0 && (
          <View style={styles.chip}>
            <Ionicons name="footsteps-outline" size={12} color={COLORS.primary} />
            <Text style={styles.chipText}>{formatKm(estimatedMeters)}</Text>
          </View>
        )}
      </View>

      {/* ─── Lista de validación ─── */}
      {showValidation && (
        validationErrors.length === 0 ? (
          <View style={styles.okRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.okText}>Todo listo para publicar.</Text>
          </View>
        ) : (
          <View style={styles.errorsBlock}>
            <Text style={styles.errorsTitle}>
              Faltan {validationErrors.length}{' '}
              {validationErrors.length === 1 ? 'cosa' : 'cosas'} antes de publicar:
            </Text>
            {validationErrors.map((err) => (
              <View key={err.field} style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{err.message}</Text>
              </View>
            ))}
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cover: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundAlt,
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.primary,
  },
  destination: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  okText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.accent,
  },
  errorsBlock: {
    gap: 6,
    paddingTop: 4,
  },
  errorsTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.text,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    flex: 1,
  },
});
