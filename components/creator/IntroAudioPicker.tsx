// components/creator/IntroAudioPicker.tsx
//
// Slot del audio de introducción del tour (pantalla 1 del panel de creador).
//   - Si NO hay audio → placeholder con borde discontinuo. Al pulsar:
//     abre el document picker filtrando `audio/*`, copia el archivo a un
//     path estable del cache (igual que la portada para evitar
//     [storage/object-not-found] en Android) y lo sube a
//     `tours/{creatorId}/{tourId}/intro-audio.{ext}`.
//   - Si HAY audio → muestra el nombre del archivo, su tamaño y dos botones
//     ("Cambiar" / "Quitar"). La reproducción real se hace en la pantalla
//     de preview con TrackPlayer; aquí no probamos duración para no
//     resetear la cola global del singleton de track-player.

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useCreator } from '@/contexts/CreatorContext';
import {
  StoragePaths,
  uploadFileWithControl,
  deleteFile,
  extractExtension,
  type UploadResult,
} from '@/services/storageService';
import { COLORS, FONTS } from '@/utils/theme';

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

function guessContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'mp3': return 'audio/mpeg';
    case 'm4a':
    case 'aac': return 'audio/aac';
    case 'wav': return 'audio/wav';
    case 'ogg':
    case 'oga': return 'audio/ogg';
    case 'flac': return 'audio/flac';
    case 'webm': return 'audio/webm';
    default: return 'audio/mpeg';
  }
}

export function IntroAudioPicker() {
  const { draft, creatorId, updateFields } = useCreator();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const hasAudio = !!draft?.introAudioUrl;

  const handlePickAndUpload = async () => {
    if (!draft || !creatorId || uploading) return;

    // 1) Document picker filtrando audio. `copyToCacheDirectory: true` ya
    //    nos da un file:// estable en cache, así que no hace falta otro
    //    copyAsync como en la portada.
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    // Tope blando de 50 MB (las reglas de Storage cortan a 50 MB exactos).
    if (asset.size && asset.size > 50 * 1024 * 1024) {
      Alert.alert(
        'Archivo demasiado grande',
        'El audio de introducción no puede superar los 50 MB. Comprímelo a 128 kbps si es muy largo.',
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    setFileName(asset.name ?? null);
    setFileSize(asset.size ?? null);

    try {
      const ext = extractExtension(asset.name ?? asset.uri, 'mp3');
      const contentType = asset.mimeType ?? guessContentType(ext);
      const storagePath = StoragePaths.introAudio(creatorId, draft.id, ext);

      const { promise } = uploadFileWithControl({
        localUri: asset.uri,
        storagePath,
        contentType,
        onProgress: setProgress,
      });
      const result: UploadResult = await promise;

      // Cleanup del blob viejo (si lo había) en background
      const oldPath = draft.introAudioStoragePath;
      if (oldPath && oldPath !== result.storagePath) {
        deleteFile(oldPath).catch(() => {});
      }

      // Persistir en el draft (autosave). Duración la dejamos null por
      // ahora: TrackPlayer es singleton y resetearlo aquí rompería la
      // reproducción si el usuario tiene algo sonando. Se calculará en
      // la pantalla de preview o al publicar.
      updateFields({
        introAudioUrl: result.url,
        introAudioStoragePath: result.storagePath,
        introAudioDuration: null,
      });
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      // Limpiar la copia local que dejó el document picker en cache.
      if (asset.uri?.startsWith(FileSystem.cacheDirectory ?? '___')) {
        FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
      }
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    if (!draft?.introAudioStoragePath && !draft?.introAudioUrl) return;
    Alert.alert(
      'Quitar audio de introducción',
      '¿Seguro que quieres eliminar el audio de introducción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const path = draft.introAudioStoragePath;
            updateFields({
              introAudioUrl: null,
              introAudioStoragePath: null,
              introAudioDuration: null,
            });
            setFileName(null);
            setFileSize(null);
            if (path) deleteFile(path).catch(() => {});
          },
        },
      ],
    );
  };

  // ─── Estado: subiendo ──────────────────────────────────────────────
  if (uploading) {
    return (
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {fileName ?? 'Subiendo audio…'}
          </Text>
          <Text style={styles.subtitle}>
            Subiendo… {Math.round(progress * 100)}%
            {fileSize ? ` · ${formatBytes(fileSize)}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  // ─── Estado: audio cargado ─────────────────────────────────────────
  if (hasAudio) {
    return (
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="musical-notes" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            Audio de introducción
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {fileName ?? 'Listo'}
            {fileSize ? ` · ${formatBytes(fileSize)}` : ''}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handlePickAndUpload}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.primary} />
          </Pressable>
          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Estado: vacío ─────────────────────────────────────────────────
  return (
    <Pressable
      onPress={handlePickAndUpload}
      style={({ pressed }) => [styles.placeholder, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="mic-outline" size={28} color={COLORS.primary} />
      <Text style={styles.placeholderTitle}>Audio de introducción</Text>
      <Text style={styles.placeholderSubtitle}>
        Toca para subir el audio de bienvenida al tour
      </Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
