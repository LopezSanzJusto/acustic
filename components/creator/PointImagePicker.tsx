// components/creator/PointImagePicker.tsx
//
// Picker de imagen para una parada (editor del punto).
// Mismo patrón que CoverImagePicker pero:
//   - Ratio 1:1 (la imagen aparece como thumbnail cuadrado en la lista).
//   - Recibe `tourId`, `pointId`, `creatorId` y el estado actual por props
//     para no acoplarse al CreatorContext (el editor maneja su propio
//     usePointDraft).

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
import * as FileSystem from 'expo-file-system/legacy';
import {
  StoragePaths,
  uploadFileWithControl,
  deleteFile,
  type UploadResult,
} from '@/services/storageService';
import { COLORS, FONTS } from '@/utils/theme';

interface PointImagePickerProps {
  creatorId: string;
  tourId: string;
  pointId: string;
  imageUrl: string | null;
  imageStoragePath: string | null;
  onChange: (patch: {
    imageUrl: string | null;
    imageStoragePath: string | null;
  }) => void;
}

export function PointImagePicker({
  creatorId,
  tourId,
  pointId,
  imageUrl,
  imageStoragePath,
  onChange,
}: PointImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasImage = !!imageUrl;

  const handlePickAndUpload = async () => {
    if (uploading) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso necesario',
        'Permite acceso a tus fotos en los ajustes para subir la imagen de la parada.',
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    setUploading(true);
    setProgress(0);

    let stableLocalUri: string | null = null;
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      stableLocalUri = `${FileSystem.cacheDirectory}point-image-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: manipulated.uri, to: stableLocalUri });

      const storagePath = StoragePaths.pointImage(creatorId, tourId, pointId, 'jpg');
      const { promise } = uploadFileWithControl({
        localUri: stableLocalUri,
        storagePath,
        contentType: 'image/jpeg',
        onProgress: setProgress,
      });
      const result: UploadResult = await promise;

      if (imageStoragePath && imageStoragePath !== result.storagePath) {
        deleteFile(imageStoragePath).catch(() => {});
      }

      onChange({
        imageUrl: result.url,
        imageStoragePath: result.storagePath,
      });
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      if (stableLocalUri) {
        FileSystem.deleteAsync(stableLocalUri, { idempotent: true }).catch(() => {});
      }
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    if (!imageUrl && !imageStoragePath) return;
    Alert.alert(
      'Quitar imagen',
      '¿Seguro que quieres eliminar la imagen de la parada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const path = imageStoragePath;
            onChange({ imageUrl: null, imageStoragePath: null });
            if (path) deleteFile(path).catch(() => {});
          },
        },
      ],
    );
  };

  if (hasImage && !uploading) {
    return (
      <View style={styles.imageWrapper}>
        <Image source={{ uri: imageUrl! }} style={styles.image} />
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
          <Text style={styles.placeholderTitle}>Foto de la parada</Text>
          <Text style={styles.placeholderSubtitle}>
            Toca para añadir una imagen
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
    aspectRatio: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 16,
    alignSelf: 'center',
    width: '60%',
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
  imageWrapper: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.backgroundAlt,
    alignSelf: 'center',
    width: '60%',
  },
  image: {
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
