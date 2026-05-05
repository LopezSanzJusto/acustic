// app/profile/personal-info.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { auth, db, firestoreReady } from '../../services/firebaseConfig';
import { COLORS } from '../../utils/theme';
import { CountrySelector } from '../../components/countrySelector';
import { DateInput } from '../../components/dateInput';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email] = useState(user?.email || '');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    firestoreReady.then(() => getDoc(doc(db, 'users', user.uid))).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setNombre(d?.name || '');
        setApellido(d?.lastName || '');
        setBirthDate(d?.birthDate || '');
        setCountry(d?.country || '');
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: nombre, lastName: apellido, birthDate, country });
      Alert.alert('Guardado', 'Información personal actualizada.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Información personal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Text style={styles.editPhotoLabel}>Editar foto</Text>
          <View style={styles.avatarWrapper}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{nombre[0]?.toUpperCase() || 'U'}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.pencilButton}
              onPress={() => Alert.alert('Editar foto', 'Disponible muy pronto.')}
            >
              <Ionicons name="pencil" size={14} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nombre + Apellido */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={setApellido}
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Año de nacimiento */}
        <View style={styles.field}>
          <Text style={styles.label}>Año de nacimiento</Text>
          <DateInput value={birthDate} onChange={setBirthDate} variant="light" />
        </View>

        {/* País */}
        <View style={styles.field}>
          <Text style={styles.label}>País</Text>
          <CountrySelector value={country} onChange={setCountry} variant="light" />
        </View>

        {/* Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDFD' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 22, paddingBottom: 50 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: COLORS.primary },

  // Avatar
  avatarSection: { alignItems: 'center', marginTop: 10, marginBottom: 28 },
  editPhotoLabel: { fontSize: 14, color: COLORS.text, marginBottom: 10, fontWeight: '500' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 32, fontWeight: 'bold', color: COLORS.white },
  pencilButton: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Campos
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfField: { flex: 1 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: COLORS.primary,  borderColor: '#8874F7', borderWidth: 1 },
  inputDisabled: { color: COLORS.muted },
  birthdate: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: COLORS.primary, borderColor: '#8874F7', borderWidth: 1 },
  country: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: COLORS.primary, borderColor: '#8874F7', borderWidth: 1 },
  // Guardar
  saveButton: { backgroundColor: '#7678ED', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
