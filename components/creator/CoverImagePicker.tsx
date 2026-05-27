// components/creator/CoverImagePicker.tsx
//
// Banner de portada de la pantalla 1 del panel de creador.
//   - Si NO hay portada → placeholder con borde discontinuo. Al pulsar:
//     pide permiso de galería, deja recortar 16:9, comprime y sube a
//     Firebase Storage en `tours/{creatorId}/{tourId}/cover.jpg`.
//   - Si HAY portada → muestra la imagen, con dos botones flotantes:
//     "Cambiar" (relanza el flujo) y "Quitar" (borra blob + limpia draft).
//   - Durante la subida → muestra spinner + porcentaje encima del slot.

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
// Importamos la API legacy explícitamente: en SDK 55, `expo-file-system`
// principal mueve copyAsync/deleteAsync/etc. a `/legacy` y lanza error si
// las usas desde el módulo raíz. La nueva API basada en `File`/`Directory`
// aún está madurando — migramos cuando el ecosistema lo haga.
import * as FileSystem from 'expo-file-system/legacy';
import { useCreator } from '@/contexts/CreatorContext';
import {
  StoragePaths,
  uploadFileWithControl,
  deleteFile,
  type UploadResult,
} from '@/services/storageService';
import { COLORS, FONTS } from '@/utils/theme';

export function CoverImagePicker() {
  const { draft, creatorId, updateFields } = useCreator();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasCover = !!draft?.coverImageUrl;

  const handlePickAndUpload = async () => {
    if (!draft || !creatorId || uploading) return;

    // 1) Permiso de galería
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso necesario',
        'Permite acceso a tus fotos en los ajustes para subir la portada.',
      );
      return;
    }

    // 2) Picker con recorte 16:9
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    setUploading(true);
    setProgress(0);

    let stableLocalUri: string | null = null;
    try {
      // 3) Resize + compresión (control de cuota de Storage)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      // 4) Copiar a un path estable bajo nuestro control: evita que el
      //    archivo temporal de ImageManipulator desaparezca a mitad de
      //    upload (causa de [storage/object-not-found] en Android).
      stableLocalUri = `${FileSystem.cacheDirectory}cover-upload-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: manipulated.uri, to: stableLocalUri });

      // 5) Subida a Storage
      const storagePath = StoragePaths.cover(creatorId, draft.id, 'jpg');
      const { promise } = uploadFileWithControl({
        localUri: stableLocalUri,
        storagePath,
        contentType: 'image/jpeg',
        onProgress: setProgress,
      });
      const result: UploadResult = await promise;

      // 6) Cleanup del blob viejo (si lo había) en background
      const oldPath = draft.coverImageStoragePath;
      if (oldPath && oldPath !== result.storagePath) {
        deleteFile(oldPath).catch(() => {});
      }

      // 7) Persistir en el draft (autosave)
      updateFields({
        coverImageUrl: result.url,
        coverImageStoragePath: result.storagePath,
      });
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      // Borra siempre la copia local temporal (no la que ya está en Storage).
      if (stableLocalUri) {
        FileSystem.deleteAsync(stableLocalUri, { idempotent: true }).catch(() => {});
      }
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    if (!draft?.coverImageStoragePath && !draft?.coverImageUrl) return;
    Alert.alert(
      'Quitar portada',
      '¿Seguro que quieres eliminar la portada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const path = draft.coverImageStoragePath;
            updateFields({ coverImageUrl: null, coverImageStoragePath: null });
            if (path) deleteFile(path).catch(() => {});
          },
        },
      ],
    );
  };

  // ─── Estado: imagen cargada ────────────────────────────────────────
  if (hasCover && !uploading) {
    return (
      <View style={styles.coverWrapper}>
        <Image source={{ uri: draft!.coverImageUrl! }} style={styles.coverImage} />
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handlePickAndUpload}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
            hitSlop={6}
          >
            <Ionicons name="camera-outline" size={16} color={COLORS.white} />
            <Text style={styles.actionText}>Cambiar</Text>
          </Pressable>
          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [styles.actionBtn, styles.removeBtn, pressed && { opacity: 0.7 }]}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.white} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Estado: vacío o subiendo ──────────────────────────────────────
  return (
    <Pressable
      onPress={handlePickAndUpload}
      disabled={uploading}
      style={({ pressed }) => [styles.placeholder, pressed && !uploading && { opacity: 0.7 }]}
    >
      {uploading ? (
        <>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.uploadingText}>
            Subiendo… {Math.round(progress * 100)}%
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="image-outline" size={28} color={COLORS.primary} />
          <Text style={styles.placeholderTitle}>Portada</Text>
          <Text style={styles.placeholderSubtitle}>
            Toca para añadir la foto principal del tour
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 16 / 9,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 6,
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
  uploadingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 6,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.backgroundAlt,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  removeBtn: {
    paddingHorizontal: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
  },
  actionText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
});
