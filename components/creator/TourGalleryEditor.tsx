// components/creator/TourGalleryEditor.tsx
//
// Editor de la galería del tour ("fotos favoritas de la ruta").
//   - Grid de 3 columnas con thumbnails 1:1.
//   - Cada thumb tiene una papelera roja en la esquina para borrar la
//     foto + el blob asociado.
//   - Al final de la grid, un slot "+" para añadir más fotos. Multi-pick
//     deshabilitado por simplicidad: se añaden de una en una para que el
//     creador vea el progreso de subida en su sitio.
//
// La persistencia va por el draft del tour (autosave del CreatorContext):
// tras cada add/remove forzamos `flushSave()` para no depender del debounce
// si el creador navega rápido.

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useCreator } from '@/contexts/CreatorContext';
import {
  StoragePaths,
  randomBlobId,
  uploadFileWithControl,
  deleteFile,
  type UploadResult,
} from '@/services/storageService';
import { COLORS, FONTS } from '@/utils/theme';

const COLS = 3;
const GAP = 8;
const HORIZONTAL_PADDING = 20; // coincide con el ScrollView de la pantalla

export function TourGalleryEditor() {
  const { draft, creatorId, updateFields, flushSave } = useCreator();
  const { width } = useWindowDimensions();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!draft || !creatorId) return null;

  const urls = draft.imageUrls ?? [];
  const paths = draft.imageStoragePaths ?? [];

  // El tamaño del tile lo calculamos a partir del ancho de la pantalla
  // descontando paddings y gaps, para que la grid quede simétrica.
  const tileSize = Math.floor(
    (width - HORIZONTAL_PADDING * 2 - GAP * (COLS - 1)) / COLS,
  );

  const handleAddPhoto = async () => {
    if (uploading) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso necesario',
        'Permite acceso a tus fotos en los ajustes para añadir imágenes a la galería.',
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

      stableLocalUri = `${FileSystem.cacheDirectory}gallery-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: manipulated.uri, to: stableLocalUri });

      const photoId = randomBlobId();
      const storagePath = StoragePaths.photo(creatorId, draft.id, photoId, 'jpg');

      const { promise } = uploadFileWithControl({
        localUri: stableLocalUri,
        storagePath,
        contentType: 'image/jpeg',
        onProgress: setProgress,
      });
      const result: UploadResult = await promise;

      // Append a los arrays. Optimistas: la UI ya muestra el cambio sin
      // esperar al servidor.
      updateFields({
        imageUrls: [...urls, result.url],
        imageStoragePaths: [...paths, result.storagePath],
      });
      // Forzamos la persistencia ya (saltándonos el debounce) para no
      // perder la referencia si el creador cierra la app rápido.
      flushSave().catch(() => {});
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

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Quitar foto',
      '¿Seguro que quieres eliminar esta foto de la galería?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const path = paths[index];
            const nextUrls = urls.filter((_, i) => i !== index);
            const nextPaths = paths.filter((_, i) => i !== index);
            updateFields({
              imageUrls: nextUrls,
              imageStoragePaths: nextPaths,
            });
            flushSave().catch(() => {});
            // Borrar el blob fuera del flujo de UI; si falla, no afecta.
            if (path) deleteFile(path).catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {urls.map((url, idx) => (
          <View
            key={paths[idx] ?? `${url}-${idx}`}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
          >
            <Image source={{ uri: url }} style={styles.tileImage} />
            <Pressable
              onPress={() => handleRemovePhoto(idx)}
              hitSlop={8}
              style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="trash" size={14} color={COLORS.white} />
            </Pressable>
          </View>
        ))}

        {/* Slot "+" o spinner si está subiendo */}
        <Pressable
          onPress={handleAddPhoto}
          disabled={uploading}
          style={({ pressed }) => [
            styles.tile,
            styles.addTile,
            { width: tileSize, height: tileSize },
            pressed && !uploading && { opacity: 0.7 },
          ]}
        >
          {uploading ? (
            <>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </>
          ) : (
            <>
              <Ionicons name="add" size={28} color={COLORS.primary} />
              <Text style={styles.addText}>Añadir foto</Text>
            </>
          )}
        </Pressable>
      </View>

      {urls.length === 0 && !uploading && (
        <Text style={styles.emptyHint}>
          Estas fotos aparecen en la página del tour. No son obligatorias, pero ayudan a vender la ruta.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundAlt,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  addTile: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  progressText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  trashBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 12,
    lineHeight: 16,
  },
});
