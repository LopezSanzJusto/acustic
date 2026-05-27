// app/creator/point/[id].tsx
//
// Editor de una parada concreta del tour.
//
// Persistencia mixta para evitar blobs huérfanos sin renunciar a la
// sensación de "guardado explícito":
//   - Imagen y audio se persisten al instante en `commitFields` (porque
//     el blob ya está en Storage; no tendría sentido aceptar que el doc
//     no lo referencie).
//   - Coordenadas se persisten desde la pantalla del mapa fullscreen al
//     pulsar "Confirmar" allí, y este editor las refresca con
//     `useFocusEffect`.
//   - Nombre y descripción quedan en local hasta que el creador pulsa el
//     botón "Guardar" del fondo. Al guardar, vuelve a la lista.
//
// Si hay cambios sin guardar y el creador intenta salir (header back,
// swipe iOS, hardware back Android), interceptamos con `beforeRemove`
// y le pedimos confirmación.

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
  useNavigation,
  useFocusEffect,
} from 'expo-router';
import { useCreator } from '@/contexts/CreatorContext';
import { usePointDraft } from '@/hooks/usePointDraft';
import { PointImagePicker } from '@/components/creator/PointImagePicker';
import { PointLocationPicker } from '@/components/creator/PointLocationPicker';
import { PointAudioPicker } from '@/components/creator/PointAudioPicker';
import { LabeledInput } from '@/components/creator/LabeledInput';
import { COLORS, FONTS } from '@/utils/theme';

export default function CreatorPointEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { draft, creatorId, loading: draftLoading } = useCreator();

  const tourId = draft?.id ?? null;
  const {
    point,
    loading: pointLoading,
    saving,
    isDirty,
    error,
    updateField,
    commitFields,
    save,
    refresh,
  } = usePointDraft(tourId, id ?? null);

  // Ref (no state) porque el listener de `beforeRemove` se dispara
  // síncronamente justo después de `router.back()`; un setState no habría
  // tenido tiempo de propagarse y el listener leería el valor viejo.
  const allowLeaveRef = useRef(false);

  // ───── Refresh al volver de la pantalla del mapa ─────
  useFocusEffect(
    useCallback(() => {
      // Recarga el point por si cambiaron coordenadas en /point-map.
      refresh().catch(() => {});
    }, [refresh]),
  );

  // ───── Interceptar salida si hay cambios sin guardar ─────
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || allowLeaveRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Cambios sin guardar',
        '¿Quieres descartar los cambios de nombre y descripción?',
        [
          { text: 'Seguir editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              allowLeaveRef.current = true;
              // Reanudar la navegación que habíamos prevenido.
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  // ───── Wrappers para imagen y audio: persisten al instante ─────
  const commitWithErrorAlert = useCallback(
    (patch: Parameters<typeof commitFields>[0]) => {
      commitFields(patch).catch((e: any) => {
        Alert.alert('Error al guardar', e?.message ?? 'Inténtalo de nuevo.');
      });
    },
    [commitFields],
  );

  const handleSave = useCallback(async () => {
    if (!isDirty || saving) {
      // Si no hay nada que guardar, simplemente vuelve.
      router.back();
      return;
    }
    try {
      await save();
      // Marcamos que la salida es legítima para que `beforeRemove` no
      // muestre el alert de "Cambios sin guardar".
      allowLeaveRef.current = true;
      router.back();
    } catch (e: any) {
      Alert.alert('Error al guardar', e?.message ?? 'Inténtalo de nuevo.');
    }
  }, [isDirty, saving, save, router]);

  const isLoading = draftLoading || pointLoading;

  // ───── Estados de carga / error ─────
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.muted}>Cargando parada…</Text>
      </View>
    );
  }

  if (!creatorId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tienes que iniciar sesión para editar paradas.</Text>
      </View>
    );
  }

  if (error || !point || !tourId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error?.message ?? 'No se pudo cargar la parada.'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. IMAGEN — persiste al instante */}
        <PointImagePicker
          creatorId={creatorId}
          tourId={tourId}
          pointId={point.id}
          imageUrl={point.imageUrl}
          imageStoragePath={point.imageStoragePath}
          onChange={commitWithErrorAlert}
        />

        {/* 2. DATOS BÁSICOS — esperan al botón Guardar */}
        <Text style={styles.sectionTitle}>Datos de la parada</Text>

        <LabeledInput
          label="Nombre"
          value={point.name}
          onChangeText={(t) => updateField('name', t)}
          placeholder="Ej. Plaza de la Cebada"
          maxLength={80}
        />

        <LabeledInput
          label="Descripción"
          value={point.description}
          onChangeText={(t) => updateField('description', t)}
          placeholder="Una línea para que el viajero sepa de qué va la parada"
          maxLength={140}
        />

        {/* 3. UBICACIÓN — abre el mapa fullscreen */}
        <Text style={styles.sectionTitle}>Ubicación</Text>
        <PointLocationPicker
          pointId={point.id}
          latitude={point.latitude}
          longitude={point.longitude}
          placeLabel={point.name}
        />

        {/* 4. AUDIO — persiste al instante */}
        <Text style={styles.sectionTitle}>Audio</Text>
        <PointAudioPicker
          creatorId={creatorId}
          tourId={tourId}
          pointId={point.id}
          audioUrl={point.audioUrl}
          audioStoragePath={point.audioStoragePath}
          audioSizeBytes={point.audioSizeBytes}
          onChange={commitWithErrorAlert}
        />
      </ScrollView>

      {/* ─── Pie fijo con botón Guardar ─── */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            saving && styles.saveBtnDisabled,
            pressed && !saving && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isDirty ? 'Guardar' : 'Listo'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
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

  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 10,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});
