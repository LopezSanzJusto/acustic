// app/(tabs)/profile.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';

import { auth } from '../../services/firebaseConfig';
import { COLORS } from '../../utils/theme';
// ✅ Importamos nuestro nuevo componente limpio
import { MenuItem } from '../../components/menuItem'; 

export default function ProfileScreen() {
  const user = auth.currentUser;

  const getInitials = () => {
    if (!user?.displayName) return "U";
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => await signOut(auth) }
    ]);
  };

  const handlePressLink = (url: string, title: string) => {
    url.startsWith('http') ? Linking.openURL(url) : Alert.alert(title, "Disponible muy pronto.");
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? <Image source={{ uri: user.photoURL }} style={styles.avatar} /> : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{getInitials()}</Text></View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={() => handlePressLink('', 'Editar Foto')}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.displayName || "Turista"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* --- SECCIONES DE MENÚ --- */}

        <Text style={styles.sectionTitle}>Mi Cuenta</Text>
        <View style={styles.section}>
          <MenuItem icon="person-outline" title="Datos Personales" onPress={() => handlePressLink('', '')} />
          <MenuItem icon="lock-closed-outline" title="Cambiar Contraseña" onPress={() => handlePressLink('', '')} />
        </View>

        <Text style={styles.sectionTitle}>Sobre Acustic</Text>
        <View style={styles.section}>
          <MenuItem icon="information-circle-outline" title="Cómo funciona" onPress={() => handlePressLink('', '')} />
          <MenuItem icon="document-text-outline" title="Política y Privacidad" onPress={() => handlePressLink('https://tu-web.com/priv', '')} />
          <MenuItem icon="help-circle-outline" title="FAQs" onPress={() => handlePressLink('', '')} />
          <MenuItem icon="mail-outline" title="Contáctanos" onPress={() => Linking.openURL('mailto:soporte@acustic.com')} />
        </View>

        <Text style={styles.sectionTitle}>Comunidad</Text>
        <View style={styles.section}>
          <MenuItem icon="megaphone-outline" title="¿Quieres ser Creador?" onPress={() => handlePressLink('https://tu-web.com', '')} />
        </View>

        <View style={[styles.section, { marginTop: 30, marginBottom: 50 }]}>
          <MenuItem icon="log-out-outline" title="Cerrar Sesión" isDestructive={true} onPress={handleLogout} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 35 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.textDark, padding: 8, borderRadius: 15, borderWidth: 3, borderColor: COLORS.background },
  userName: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 5 },
  userEmail: { fontSize: 14, color: COLORS.muted },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.muted, marginLeft: 25, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  section: { backgroundColor: COLORS.surface, marginHorizontal: 15, borderRadius: 20, marginBottom: 25, paddingVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
});