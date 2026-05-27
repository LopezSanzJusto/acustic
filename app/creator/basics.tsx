// app/creator/basics.tsx
//
// Pantalla 1 del wizard: Datos básicos.
// Orden visual:
//   1. Banner de portada
//   2. Datos básicos (título, destino, precio, categoría)
//   3. Audio de introducción
//   4. Botón Siguiente (habilitado cuando title + destination + category rellenos)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreator } from '@/contexts/CreatorContext';
import { LabeledInput } from '@/components/creator/LabeledInput';
import { CategoryPicker } from '@/components/creator/CategoryPicker';
import { CoverImagePicker } from '@/components/creator/CoverImagePicker';
import { IntroAudioPicker } from '@/components/creator/IntroAudioPicker';
import { COLORS, FONTS } from '@/utils/theme';

export default function CreatorBasicsScreen() {
  const router = useRouter();
  const { draft, loading, error, creatorId, updateField, flushSave } = useCreator();
  const [navigating, setNavigating] = useState(false);

  const canProceed =
    !!draft &&
    (draft.title ?? '').trim().length >= 3 &&
    (draft.destination ?? '').trim().length >= 2 &&
    draft.category !== null;

  const handleNext = async () => {
    if (!canProceed || navigating) return;
    setNavigating(true);
    try {
      await flushSave();
    } finally {
      setNavigating(false);
    }
    router.push('/creator/points' as any);
  };

  // ───── Estados de carga / errores ─────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.muted}>Cargando borrador…</Text>
      </View>
    );
  }

  if (!creatorId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Tienes que iniciar sesión para crear una audioguía.</Text>
      </View>
    );
  }

  if (error || !draft) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error?.message ?? 'No se pudo cargar el borrador.'}
        </Text>
      </View>
    );
  }

  // ───── Contenido ─────
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
        {/* 1. PORTADA */}
        <CoverImagePicker />

        {/* 2. DATOS BÁSICOS */}
        <Text style={styles.sectionTitle}>Datos básicos</Text>

        <LabeledInput
          label="Título"
          value={draft.title ?? ''}
          onChangeText={(t) => updateField('title', t)}
          placeholder="Ej. El barrio de La Latina"
          maxLength={80}
        />

        <LabeledInput
          label="Destino"
          value={draft.destination ?? ''}
          onChangeText={(t) => updateField('destination', t)}
          placeholder="Ej. Madrid, España"
          maxLength={80}
        />

        <LabeledInput
          label="Precio"
          value="Gratis"
          onChangeText={() => {}}
          editable={false}
          hint="Próximamente podrás cobrar por tus tours."
        />

        <CategoryPicker
          value={draft.category}
          onChange={(id) => updateField('category', id)}
        />

        {/* 3. AUDIO DE INTRODUCCIÓN */}
        <IntroAudioPicker />

        {/* 4. BOTÓN SIGUIENTE */}
        <Pressable
          onPress={handleNext}
          disabled={!canProceed || navigating}
          style={({ pressed }) => [
            styles.nextButton,
            (!canProceed || navigating) && styles.nextButtonDisabled,
            pressed && canProceed && !navigating && { opacity: 0.85 },
          ]}
        >
          {navigating ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.nextButtonText}>Siguiente</Text>
          )}
        </Pressable>

        {!canProceed && (
          <Text style={styles.hint}>
            Rellena el título, el destino y la categoría para continuar.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  muted: { fontFamily: FONTS.regular, color: COLORS.muted },
  error: { fontFamily: FONTS.medium, color: COLORS.error, textAlign: 'center' },

  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 14,
  },

  nextButton: {
    marginTop: 28,
    alignSelf: 'flex-end',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minWidth: 130,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 8,
  },
});
