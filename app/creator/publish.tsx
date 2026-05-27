// app/creator/publish.tsx
//
// Pantalla 3 del wizard: galería + resumen + publicar.
//   - Galería de fotos "favoritas" del tour (TourGalleryEditor).
//   - Resumen del draft + validación previa (TourSummary).
//   - Botón "Publicar" abajo, deshabilitado mientras haya errores de
//     validación o un publish en curso.
//
// Al publicar con éxito, usamos `router.replace` a /(tabs)/trips para
// que el creador no pueda volver al wizard del tour ya publicado (el
// `publish()` del hook lo deja en estado vacío de todos modos).

import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreator } from '@/contexts/CreatorContext';
import { TourGalleryEditor } from '@/components/creator/TourGalleryEditor';
import { TourSummary } from '@/components/creator/TourSummary';
import { validateForPublish } from '@/services/creatorService';
import { COLORS, FONTS } from '@/utils/theme';

export default function CreatorPublishScreen() {
  const router = useRouter();
  const {
    draft,
    points,
    loading,
    error,
    creatorId,
    publish,
  } = useCreator();

  const [publishing, setPublishing] = useState(false);

  // ───── Estados de carga / error ─────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.muted}>Cargando…</Text>
      </View>
    );
  }

  if (!creatorId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tienes que iniciar sesión para publicar.</Text>
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

  const validationErrors = validateForPublish(draft, points);
  const canPublish = validationErrors.length === 0 && !publishing;

  const handlePublish = async () => {
    if (!canPublish) {
      if (validationErrors.length > 0) {
        Alert.alert(
          'No se puede publicar todavía',
          validationErrors.map((e) => `• ${e.message}`).join('\n'),
        );
      }
      return;
    }
    setPublishing(true);
    try {
      await publish();
      // El draft ha desaparecido (status=published). Salimos del wizard
      // antes de que el provider intente recargar otra cosa.
      router.replace('/(tabs)/trips' as any);
      // Pequeño retardo no necesario: el Alert es informativo y no debe
      // bloquear la navegación. Lo mostramos después de programar el back.
      Alert.alert('¡Publicado!', 'Tu audioguía ya está disponible.');
    } catch (e: any) {
      Alert.alert(
        'Error al publicar',
        e?.message ?? 'Inténtalo de nuevo en unos minutos.',
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroTitle}>Estás a un paso</Text>
        <Text style={styles.heroSubtitle}>
          Añade fotos que vendan tu ruta y revisa el resumen antes de publicar.
        </Text>

        {/* 1. GALERÍA */}
        <Text style={styles.sectionTitle}>Galería del tour</Text>
        <TourGalleryEditor />

        {/* 2. RESUMEN + VALIDACIÓN */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <TourSummary />

        {/* 3. PREVIEW: abre la misma pantalla que verá el usuario final */}
        <Pressable
          onPress={() => router.push(`/tour/${draft.id}?preview=1` as any)}
          style={({ pressed }) => [
            styles.previewBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
          <Text style={styles.previewBtnText}>
            Ver como en Explora
          </Text>
        </Pressable>
      </ScrollView>

      {/* ─── Pie fijo con botón Publicar ─── */}
      <View style={styles.footer}>
        <Pressable
          onPress={handlePublish}
          disabled={!canPublish}
          style={({ pressed }) => [
            styles.publishBtn,
            !canPublish && styles.publishBtnDisabled,
            pressed && canPublish && { opacity: 0.85 },
          ]}
        >
          {publishing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.publishBtnText}>Publicar audioguía</Text>
          )}
        </Pressable>
        {validationErrors.length > 0 && !publishing && (
          <Text style={styles.publishHint}>
            Completa los puntos rojos del resumen para activar el botón.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
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

  heroTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.primary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 18,
    lineHeight: 18,
  },

  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 12,
  },

  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  previewBtnText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    opacity: 0.45,
  },
  publishBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  publishHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
