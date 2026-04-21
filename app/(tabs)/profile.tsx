// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { auth, db, firestoreReady } from '../../services/firebaseConfig';
import { COLORS } from '../../utils/theme';
import { MenuItem } from '../../components/menuItem';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState(user?.displayName?.split(' ')[0] || 'Viajero');

  useEffect(() => {
    if (!user) return;
    firestoreReady.then(() => getDoc(doc(db, 'users', user.uid))).then((snap) => {
      if (snap.exists()) {
        const name = snap.data().name;
        if (name) setFirstName(name);
      }
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => await signOut(auth) },
    ]);
  };

  const soon = (title: string) => Alert.alert(title, 'Disponible muy pronto.');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Cabecera */}
        <Text style={styles.greeting}>¡Hola {firstName}!</Text>
        <View style={styles.avatarWrapper}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {firstName[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Sección: Ajustes de cuenta */}
        <Text style={styles.sectionTitle}>Ajustes de cuenta</Text>
        <View style={styles.section}>
          <MenuItem
            icon="briefcase-outline"
            iconBgColor="#E8F4FD"
            iconColor="#4A9EDE"
            title="Información personal"
            onPress={() => router.push('/profile/personal-info' as any)}
          />
          <MenuItem
            icon="lock-closed-outline"
            iconBgColor="#F0EDFF"
            iconColor={COLORS.primary}
            title="Cambio de contraseña"
            onPress={() => router.push('/profile/change-password' as any)}
          />
          <MenuItem
            icon="notifications-outline"
            iconBgColor="#FFF8E1"
            iconColor="#F5A623"
            title="Notificaciones y permisos"
            onPress={() => soon('Notificaciones y permisos')}
            showBorder={false}
          />
        </View>

        {/* Sección: Sobre Acustic */}
        <Text style={styles.sectionTitle}>Sobre Acustic</Text>
        <View style={styles.section}>
          <MenuItem
            icon="globe-outline"
            iconBgColor="#FFF0F0"
            iconColor="#E05C5C"
            title="Privacidad y términos de uso"
            onPress={() => router.push('/profile/privacy' as any)}
            showBorder={false}
          />
        </View>

        {/* Sección: Centro de ayuda */}
        <Text style={styles.sectionTitle}>Centro de ayuda</Text>
        <View style={styles.section}>
          <MenuItem
            icon="help-circle-outline"
            iconBgColor="#F0EDFF"
            iconColor={COLORS.primary}
            title="Preguntas frecuentes"
            onPress={() => router.push('/profile/faq' as any)}
          />
          <MenuItem
            icon="person-outline"
            iconBgColor="#FFF3E8"
            iconColor="#F5A623"
            title="Contáctanos"
            onPress={() => Linking.openURL('mailto:soporte@acustic.com')}
            showBorder={false}
          />
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 60 },

  // Cabecera
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginTop: 24, marginBottom: 16 },
  avatarWrapper: { alignSelf: 'center', marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 34, fontWeight: 'bold', color: COLORS.white },

  // Secciones
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginLeft: 20, marginBottom: 8, marginTop: 4 },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: COLORS.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Cerrar sesión
  logoutRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginTop: 4, gap: 8 },
  logoutText: { fontSize: 16, color: COLORS.error, fontWeight: '500' },
});
