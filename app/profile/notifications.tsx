// app/profile/notifications.tsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../utils/theme';
import { usePermissions } from '../../hooks/usePermissions';
import { useUserPreferences, UserPreferences } from '../../hooks/useUserPreferences';

const SWITCH_ON = '#4CAF50';
const SWITCH_OFF = '#D1D5DB';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perms, toggleForegroundLocation, toggleBackgroundLocation, toggleNotifications } = usePermissions();
  const { prefs, loading, updatePref } = useUserPreferences();

  const fgGranted     = perms.locationForeground === 'granted';
  const bgGranted     = perms.locationBackground === 'granted';
  const notifGranted  = perms.notifications === 'granted';

  const renderRow = (
    label: string,
    value: boolean,
    onToggle: () => void,
    disabled = false,
  ) => (
    <View style={styles.row}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: SWITCH_OFF, true: SWITCH_ON }}
        thumbColor={COLORS.white}
      />
    </View>
  );

  // Fila sin implementar: texto y switch en gris claro, no interactuable
  const renderComingSoonRow = (label: string) => (
    <View style={[styles.row, styles.rowComingSoon]}>
      <Text style={styles.labelComingSoon}>{label}</Text>
      <Switch
        value={false}
        onValueChange={() => {}}
        disabled
        trackColor={{ false: '#E8E8E8', true: '#E8E8E8' }}
        thumbColor='#C0C0C0'
      />
    </View>
  );

  const renderDivider = () => <View style={styles.divider} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones y permisos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* #1 — Ubicación (permiso del SO) */}
            {renderRow('Permite ubicación', fgGranted, toggleForegroundLocation)}
            {renderDivider()}

            {/* #2 — Notificaciones */}
            {renderRow('Permite notificaciones', notifGranted, toggleNotifications)}
            {renderDivider()}

            {/* #3 — Pop-up cerca de POI */}
            {renderRow(
              'Pop-up cerca de un punto de interés',
              prefs.popupNearPoi,
              () => updatePref('popupNearPoi', !prefs.popupNearPoi),
            )}
            {renderDivider()}

            {/* #4 — Reproducción automática */}
            {renderRow(
              'Reproducción automática cerca de un punto de interés',
              prefs.autoPlayNearPoi,
              () => updatePref('autoPlayNearPoi', !prefs.autoPlayNearPoi),
            )}
            {renderDivider()}

            {/* #5 — Descargas automáticas */}
            {renderRow(
              'Permite descargas automáticas',
              prefs.autoDownload,
              () => updatePref('autoDownload', !prefs.autoDownload),
            )}
            {renderDivider()}

            {/* #6 — Notificaciones en segundo plano */}
            {renderRow(
              'Notificaciones en segundo plano',
              prefs.bgNotifications,
              () => updatePref('bgNotifications', !prefs.bgNotifications),
            )}
            {renderDivider()}

            {/* #7 — Ubicación en segundo plano (permiso del SO) */}
            {renderRow(
              'Permite que te guiemos al siguiente punto cuando apagues la pantalla',
              bgGranted,
              toggleBackgroundLocation,
              !fgGranted, // deshabilitado si no tiene permiso foreground
            )}
            {renderDivider()}

            {/* #8 — Newsletter */}
            {renderRow(
              'Suscripción a la newsletter de Acustic',
              prefs.newsletter,
              () => updatePref('newsletter', !prefs.newsletter),
            )}
            {renderDivider()}

            {/* #9 — Promociones */}
            {renderRow(
              'Permite que te enviemos promociones y nuevos tours a tu correo',
              prefs.promos,
              () => updatePref('promos', !prefs.promos),
            )}
          </View>

          <Text style={styles.hint}>
            Los permisos del sistema (ubicación) se gestionan desde los Ajustes de tu
            dispositivo. Si el toggle no responde, puede que ya hayas concedido o denegado
            el permiso — te llevaremos a Ajustes para cambiarlo.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 0.8,
    borderColor: COLORS.primary + '40',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  labelDisabled: {
    color: COLORS.muted,
  },

  rowComingSoon: {
    backgroundColor: '#FAFAFA',
  },
  labelComingSoon: {
    flex: 1,
    fontSize: 15,
    color: '#C0C0C0',
    lineHeight: 21,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 18,
  },

  hint: {
    marginTop: 16,
    marginHorizontal: 4,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
});
