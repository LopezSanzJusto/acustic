// app/profile/personal-info.tsx

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, Modal, FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../services/firebaseConfig';
import { COLORS } from '../../utils/theme';

const COUNTRIES = [
  'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú',
  'Venezuela', 'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay',
  'Estados Unidos', 'Francia', 'Italia', 'Alemania', 'Reino Unido',
  'Portugal', 'Brasil', 'Otro',
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;

  const nameParts = (user?.displayName || '').split(' ');
  const [nombre, setNombre] = useState(nameParts[0] || '');
  const [apellido, setApellido] = useState(nameParts.slice(1).join(' ') || '');
  const [email] = useState(user?.email || '');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('España');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const handleSave = () => {
    Alert.alert('Guardado', 'Información personal actualizada.');
  };

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
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="numeric"
          />
        </View>

        {/* País */}
        <View style={styles.field}>
          <Text style={styles.label}>País</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setCountryModalVisible(true)}>
            <Text style={styles.dropdownText}>{country}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal selector de país */}
      <Modal visible={countryModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setCountryModalVisible(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Selecciona tu país</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, item === country && styles.modalItemActive]}
                onPress={() => { setCountry(item); setCountryModalVisible(false); }}
              >
                <Text style={[styles.modalItemText, item === country && styles.modalItemTextActive]}>
                  {item}
                </Text>
                {item === country && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: COLORS.primary },
  inputDisabled: { color: COLORS.muted },
  dropdown: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { fontSize: 16, color: COLORS.primary },

  // Guardar
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  // Modal país
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  modalItemActive: {},
  modalItemText: { fontSize: 16, color: COLORS.text },
  modalItemTextActive: { color: COLORS.primary, fontWeight: '600' },
});
