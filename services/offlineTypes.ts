export type DownloadStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'error';

// Fase durante 'downloading': 'assets' descarga audio+imágenes, 'map' descarga tiles
export type DownloadPhase = 'assets' | 'map';

export interface DownloadEntry {
  status: DownloadStatus;
  progress: number;        // 0–1 (assets o tiles según phase)
  bytesDownloaded: number;
  totalBytes: number;
  phase?: DownloadPhase;   // solo presente durante 'downloading'
  error?: string;
}
