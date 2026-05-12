// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
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
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!user) return;
    firestoreReady.then(() => getDoc(doc(db, 'users', user.uid))).then((snap) => {
      if (snap.exists()) {
        const name = snap.data()?.name;
        if (name) setFirstName(name);
      }
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            if (auth.currentUser) {
              await signOut(auth);
            }
          } catch (err: any) {
            if (err?.code !== 'auth/no-current-user') {
              console.log('🔴 LOGOUT ERROR →', err?.code, err?.message);
            }
          }
          router.replace('/welcome' as any);
        },
      },
    ]);
  };

  const soon = (title: string) => Alert.alert(title, 'Disponible muy pronto.');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Cabecera */}
        <Text style={styles.greeting}>¡Hola {firstName}!</Text>
        <View style={styles.avatarWrapper}>
          {user?.photoURL && !photoError ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatar}
              onError={() => setPhotoError(true)}
            />
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
            imageSource={require('../../assets/images/icons/Informacion_Personal.png')}
            iconBgColor="#E8F4FD"
            title="Información personal"
            onPress={() => router.push('/profile/personal-info' as any)}
          />
          <MenuItem
            imageSource={require('../../assets/images/icons/Cambio_de_Contraseña.png')}
            iconBgColor="#F0EDFF"
            title="Cambio de contraseña"
            onPress={() => router.push('/profile/change-password' as any)}
          />
          <MenuItem
            imageSource={require('../../assets/images/icons/Notificaciones_y_Permisos.png')}
            iconBgColor="#FFF8E1"
            title="Notificaciones y permisos"
            onPress={() => router.push('/profile/notifications' as any)}
          />
        </View>

        {/* Sección: Sobre Acustic */}
        <Text style={styles.sectionTitle}>Sobre Acustic</Text>
        <View style={styles.section}>
          <MenuItem
            imageSource={require('../../assets/images/icons/Privacidad_y_Terminos_de_Uso.png')}
            iconBgColor="#FFF0F0"
            title="Privacidad y términos de uso"
            onPress={() => router.push('/profile/privacy' as any)}
          />
        </View>

        {/* Sección: Centro de ayuda */}
        <Text style={styles.sectionTitle}>Centro de ayuda</Text>
        <View style={styles.section}>
          <MenuItem
            imageSource={require('../../assets/images/icons/Preguntas_Frecuentes.png')}
            iconBgColor="#F0EDFF"
            title="Preguntas frecuentes"
            onPress={() => router.push('/profile/faq' as any)}
          />
          <MenuItem
            imageSource={require('../../assets/images/icons/Contáctanos.png')}
            iconBgColor="#FFF3E8"
            title="Contáctanos"
            onPress={() => Linking.openURL('mailto:soporte@acustic.com')}
          />
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <Image source={require('../../assets/images/icons/Cerrar_Sesion.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingBottom: 60 },

  // Cabecera
  greeting: { fontSize: 20, fontWeight: '700', color: '#8C77ED', textAlign: 'center', marginTop: 24, marginBottom: 16 },
  avatarWrapper: { alignSelf: 'center', marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 34, fontWeight: 'bold', color: COLORS.white },

  // Secciones
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#4E4FA5', marginLeft: 20, marginBottom: 8, marginTop: 0 },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // Cerrar sesión
  logoutRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginTop: 4, gap: 8 },
  logoutText: { fontSize: 16, color: COLORS.error, fontWeight: '500' },
});
