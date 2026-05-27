// components/creator/PointAudioPicker.tsx
//
// Picker de audio para una parada (editor del punto).
// Mismo patrón que IntroAudioPicker pero:
//   - Recibe el estado y handler por props (sin acoplarse a CreatorContext).
//   - Persiste también el tamaño en bytes en `audioSizeBytes` para que la
//     pantalla de revisión / publicar pueda mostrar cuánto pesa el tour.

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

interface PointAudioPickerProps {
  creatorId: string;
  tourId: string;
  pointId: string;
  audioUrl: string | null;
  audioStoragePath: string | null;
  audioSizeBytes: number | null;
  onChange: (patch: {
    audioUrl: string | null;
    audioStoragePath: string | null;
    audioDuration: number | null;
    audioSizeBytes: number | null;
  }) => void;
}

export function PointAudioPicker({
  creatorId,
  tourId,
  pointId,
  audioUrl,
  audioStoragePath,
  audioSizeBytes,
  onChange,
}: PointAudioPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stagedSize, setStagedSize] = useState<number | null>(null);

  const hasAudio = !!audioUrl;

  const handlePickAndUpload = async () => {
    if (uploading) return;

    const picked = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    if (asset.size && asset.size > 50 * 1024 * 1024) {
      Alert.alert(
        'Archivo demasiado grande',
        'El audio de la parada no puede superar los 50 MB. Comprímelo a 128 kbps si es muy largo.',
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    setFileName(asset.name ?? null);
    setStagedSize(asset.size ?? null);

    try {
      const ext = extractExtension(asset.name ?? asset.uri, 'mp3');
      const contentType = asset.mimeType ?? guessContentType(ext);
      const storagePath = StoragePaths.pointAudio(creatorId, tourId, pointId, ext);

      const { promise } = uploadFileWithControl({
        localUri: asset.uri,
        storagePath,
        contentType,
        onProgress: setProgress,
      });
      const result: UploadResult = await promise;

      if (audioStoragePath && audioStoragePath !== result.storagePath) {
        deleteFile(audioStoragePath).catch(() => {});
      }

      onChange({
        audioUrl: result.url,
        audioStoragePath: result.storagePath,
        // La duración se calculará al publicar (con expo-audio) para no
        // resetear el TrackPlayer global aquí.
        audioDuration: null,
        audioSizeBytes: result.sizeBytes,
      });
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      if (asset.uri?.startsWith(FileSystem.cacheDirectory ?? '___')) {
        FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(() => {});
      }
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    if (!audioUrl && !audioStoragePath) return;
    Alert.alert(
      'Quitar audio',
      '¿Seguro que quieres eliminar el audio de la parada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const path = audioStoragePath;
            onChange({
              audioUrl: null,
              audioStoragePath: null,
              audioDuration: null,
              audioSizeBytes: null,
            });
            setFileName(null);
            setStagedSize(null);
            if (path) deleteFile(path).catch(() => {});
          },
        },
      ],
    );
  };

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
            {stagedSize ? ` · ${formatBytes(stagedSize)}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="musical-notes" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            Audio de la parada
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {fileName ?? 'Listo'}
            {audioSizeBytes ? ` · ${formatBytes(audioSizeBytes)}` : ''}
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

  return (
    <Pressable
      onPress={handlePickAndUpload}
      style={({ pressed }) => [styles.placeholder, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="mic-outline" size={28} color={COLORS.primary} />
      <Text style={styles.placeholderTitle}>Audio de la parada</Text>
      <Text style={styles.placeholderSubtitle}>
        Toca para subir el audio explicativo de este punto
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
  info: { flex: 1, minWidth: 0 },
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
  actionsRow: { flexDirection: 'row', gap: 6 },
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
