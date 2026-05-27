// app/creator/points.tsx
//
// Pantalla 2 del wizard: lista de paradas del tour.
//   - Encabezado "Crea tu audio tour" + botón "Preview" (próximamente).
//   - DraggableFlatList con las paradas: tap → editor del punto;
//     long-press solo en modo "Modificar" → arrastrar para reordenar.
//   - Botón "+" al final para crear un point vacío en Firestore y
//     navegar al editor con su id.
//   - Pie fijo: "Modificar" (toggle del modo edición) y "Siguiente"
//     (deshabilitado hasta tener ≥ 2 paradas).

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useCreator } from '@/contexts/CreatorContext';
import { PointCard } from '@/components/creator/PointCard';
import { COLORS, FONTS } from '@/utils/theme';
import type { TourPoint } from '@/types/tour';

const MIN_POINTS_TO_CONTINUE = 2;

export default function CreatorPointsScreen() {
  const router = useRouter();
  const {
    draft,
    points,
    loading,
    error,
    creatorId,
    addPoint,
    removePoint,
    persistPointsOrder,
    refreshPoints,
  } = useCreator();

  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  // Al volver del editor del punto, recargamos para reflejar imagen/nombre/coords
  // recién persistidos por el autosave del editor.
  useFocusEffect(
    useCallback(() => {
      refreshPoints().catch(() => { /* silencioso: el draft puede no estar listo aún */ });
    }, [refreshPoints]),
  );

  // ───── Handlers ─────
  const handleAdd = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      const created = await addPoint();
      router.push(`/creator/point/${created.id}` as any);
    } catch (e: any) {
      Alert.alert('No se pudo crear la parada', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setAdding(false);
    }
  }, [adding, addPoint, router]);

  const handleOpenPoint = useCallback(
    (pointId: string) => {
      if (editing) return; // En modo edición, el tap no abre el editor.
      router.push(`/creator/point/${pointId}` as any);
    },
    [editing, router],
  );

  const handleDelete = useCallback(
    (point: TourPoint) => {
      Alert.alert(
        'Eliminar parada',
        '¿Seguro que quieres eliminar esta parada? Se borrará su audio y su imagen.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              removePoint(point.id).catch((e: any) => {
                Alert.alert('Error al eliminar', e?.message ?? 'Inténtalo de nuevo.');
              });
            },
          },
        ],
      );
    },
    [removePoint],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: TourPoint[] }) => {
      persistPointsOrder(data).catch((e: any) => {
        Alert.alert('Error al reordenar', e?.message ?? 'Inténtalo de nuevo.');
      });
    },
    [persistPointsOrder],
  );

  const handlePreview = useCallback(() => {
    router.push('/creator/preview' as any);
  }, [router]);

  const handleNext = useCallback(() => {
    if (points.length < MIN_POINTS_TO_CONTINUE) return;
    router.push('/creator/publish' as any);
  }, [points.length, router]);

  // ───── Estados de carga / error ─────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.muted}>Cargando paradas…</Text>
      </View>
    );
  }

  if (!creatorId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tienes que iniciar sesión para crear una audioguía.</Text>
      </View>
    );
  }

  if (error || !draft) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error?.message ?? 'No se pudo cargar el borrador.'}
        </Text>
      </View>
    );
  }

  // ───── Render de un item (draggable) ─────
  const renderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<TourPoint>) => {
    const idx = (getIndex() ?? 0) + 1;
    return (
      <ScaleDecorator>
        <PointCard
          point={item}
          index={idx}
          editing={editing}
          isActive={isActive}
          onPress={() => handleOpenPoint(item.id)}
          onDelete={() => handleDelete(item)}
          onDrag={editing ? drag : undefined}
        />
      </ScaleDecorator>
    );
  };

  const canContinue = points.length >= MIN_POINTS_TO_CONTINUE && !editing;

  return (
    <View style={styles.flex}>
      {/* ─── Encabezado interno ─── */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Crea tu audio tour</Text>
        <Pressable
          onPress={handlePreview}
          style={({ pressed }) => [styles.previewBtn, pressed && { opacity: 0.85 }]}
          hitSlop={6}
        >
          <Text style={styles.previewBtnText}>Preview</Text>
          <Ionicons name="map-outline" size={16} color={COLORS.white} />
        </Pressable>
      </View>

      {/* ─── Lista de paradas ─── */}
      <DraggableFlatList
        data={points}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        activationDistance={editing ? 5 : 1000}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            Aún no has añadido ninguna parada. Toca el botón + para empezar.
          </Text>
        }
        ListFooterComponent={
          <Pressable
            onPress={handleAdd}
            disabled={adding}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && !adding && { opacity: 0.85 },
              adding && { opacity: 0.6 },
            ]}
          >
            {adding ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Ionicons name="add" size={32} color={COLORS.primary} />
            )}
          </Pressable>
        }
      />

      {/* ─── Pie fijo ─── */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => setEditing((v) => !v)}
          disabled={points.length === 0}
          style={({ pressed }) => [
            styles.modifyBtn,
            editing && styles.modifyBtnActive,
            pressed && { opacity: 0.85 },
            points.length === 0 && { opacity: 0.45 },
          ]}
        >
          <Text style={[styles.modifyBtnText, editing && styles.modifyBtnTextActive]}>
            {editing ? 'Listo' : 'Modificar'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.nextBtn,
            !canContinue && styles.nextBtnDisabled,
            pressed && canContinue && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.nextBtnText}>Siguiente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: COLORS.background,
  },
  muted: { fontFamily: FONTS.regular, color: COLORS.muted },
  errorText: { fontFamily: FONTS.medium, color: COLORS.error, textAlign: 'center' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.primary,
    flexShrink: 1,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  previewBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  addBtn: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modifyBtn: {
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    minWidth: 130,
    alignItems: 'center',
  },
  modifyBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modifyBtnText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  modifyBtnTextActive: {
    color: COLORS.white,
  },
  nextBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minWidth: 130,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.45,
  },
  nextBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});
