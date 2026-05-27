// app/creator/basics.tsx
//
// Pantalla 1 del wizard: Datos básicos.
// Orden visual (Figma):
//   1. Banner de portada            (placeholder en 5.2a → real en 5.2b)
//   2. Datos básicos
//        - Título
//        - Destino
//        - Precio (read-only "Gratis", reservado para v2)
//        - Categoría
//   3. Audio de introducción         (placeholder en 5.2a → real en 5.2c)
//   4. Fotos favoritas de la ruta    (placeholder en 5.2a → real en 5.2d)
//   5. Botón Siguiente               (validación + activación en 5.2e)

import React from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useCreator } from '@/contexts/CreatorContext';
import { LabeledInput } from '@/components/creator/LabeledInput';
import { CategoryPicker } from '@/components/creator/CategoryPicker';
import { COLORS, FONTS } from '@/utils/theme';

export default function CreatorBasicsScreen() {
  const { draft, loading, error, creatorId, updateField } = useCreator();

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
        {/* 1. PORTADA (placeholder) */}
        <PlaceholderSlot
          icon="image-outline"
          title="Portada"
          subtitle="Toca para añadir la foto principal del tour"
          height={180}
        />

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

        {/* 3. AUDIO DE INTRODUCCIÓN (placeholder) */}
        <PlaceholderSlot
          icon="mic-outline"
          title="Audio de introducción"
          subtitle="Sube el audio que da la bienvenida al tour"
          height={80}
        />

        {/* 4. FOTOS FAVORITAS (placeholder) */}
        <PlaceholderSlot
          icon="images-outline"
          title="Fotos favoritas de la ruta"
          subtitle="Añade hasta varias fotos para mostrar el recorrido"
          height={120}
        />

        {/* 5. BOTÓN SIGUIENTE (deshabilitado hasta 5.2e) */}
        <Pressable
          disabled
          style={[styles.nextButton, styles.nextButtonDisabled]}
        >
          <Text style={styles.nextButtonText}>Siguiente</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Placeholder reutilizable para los slots de media (banner / audio / fotos).
// Se reemplazará por los componentes reales en 5.2b/c/d.
// ───────────────────────────────────────────────────────────────────────

interface PlaceholderSlotProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  height: number;
}

function PlaceholderSlot({ icon, title, subtitle, height }: PlaceholderSlotProps) {
  return (
    <View style={[styles.placeholder, { minHeight: height }]}>
      <Ionicons name={icon} size={28} color={COLORS.primary} />
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
    </View>
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

  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.primary,
  },
  placeholderSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },

  nextButton: {
    marginTop: 28,
    alignSelf: 'flex-end',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
});
