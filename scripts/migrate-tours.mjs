// scripts/migrate-tours.mjs
//
// Migración idempotente de tours antiguos al nuevo modelo del panel de creador.
//
// Qué hace:
//   - Por cada doc en /tours: añade creatorId, status, createdAt, publishedAt,
//     coverImageUrl, coverImageStoragePath, imageStoragePaths, introAudioStoragePath,
//     introAudioDuration, y normaliza category al id en minúsculas.
//   - Por cada doc en /tours/{tourId}/points: añade creatorId, tourStatus,
//     audioStoragePath, imageStoragePath, audioDuration, audioSizeBytes,
//     description (si falta), placeId, createdAt, updatedAt.
//
// Es idempotente: si un campo ya existe con valor válido, NO lo sobrescribe.
// Se puede correr varias veces sin pifiar.
//
// Cómo correrlo:
//   1) cd scripts && npm install firebase-admin
//   2) Descarga la service-account key desde Firebase Console:
//        Project Settings → Service accounts → Generate new private key
//      Guárdala en scripts/.secrets/serviceAccount.json
//   3) node scripts/migrate-tours.mjs --dry-run   (modo simulación, no escribe)
//   4) node scripts/migrate-tours.mjs              (ejecuta de verdad)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '.secrets/serviceAccount.json');

const DRY_RUN = process.argv.includes('--dry-run');

const CREATOR_ID_OLD_TOURS = 'acustic-official';

const CATEGORY_LABEL_TO_ID = {
  'Historia':    'historia',
  'Arte':        'arte',
  'Gastronomía': 'gastronomia',
  'Gastronomia': 'gastronomia',
  'Cultura':     'cultura',
};

function loadServiceAccount() {
  try {
    return JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  } catch (err) {
    console.error(`\n❌ No se pudo leer la service account en:\n   ${SERVICE_ACCOUNT_PATH}\n`);
    console.error('   Descárgala desde Firebase Console → Project Settings → Service accounts.\n');
    process.exit(1);
  }
}

function pickFirstDefined(...values) {
  for (const v of values) if (v !== undefined && v !== null) return v;
  return undefined;
}

async function migrateTours(db) {
  const toursSnap = await db.collection('tours').get();
  console.log(`\n📦 Encontrados ${toursSnap.size} tours.\n`);

  let toursUpdated = 0;
  let pointsUpdated = 0;
  let pointsScanned = 0;

  for (const tourDoc of toursSnap.docs) {
    const tourId = tourDoc.id;
    const data = tourDoc.data();
    const patch = {};

    if (!data.creatorId) patch.creatorId = CREATOR_ID_OLD_TOURS;
    if (!data.status)    patch.status = 'published';

    if (typeof data.category === 'string' && CATEGORY_LABEL_TO_ID[data.category]) {
      const normalized = CATEGORY_LABEL_TO_ID[data.category];
      if (data.category !== normalized) patch.category = normalized;
    }

    if (!data.createdAt) {
      patch.createdAt = data.publishedAt || admin.firestore.FieldValue.serverTimestamp();
    }
    if (!data.publishedAt) {
      patch.publishedAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    }
    if (!('updatedAt' in data)) {
      patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (!('coverImageUrl' in data))         patch.coverImageUrl = null;
    if (!('coverImageStoragePath' in data)) patch.coverImageStoragePath = null;
    if (!('introAudioStoragePath' in data)) patch.introAudioStoragePath = null;
    if (!('introAudioDuration' in data))    patch.introAudioDuration = null;

    if (!Array.isArray(data.imageStoragePaths)) {
      const len = Array.isArray(data.imageUrls) ? data.imageUrls.length : 0;
      patch.imageStoragePaths = new Array(len).fill(null);
    }

    if (Object.keys(patch).length > 0) {
      console.log(`  • tour ${tourId}: ${Object.keys(patch).join(', ')}`);
      if (!DRY_RUN) await tourDoc.ref.update(patch);
      toursUpdated++;
    }

    const pointsSnap = await tourDoc.ref.collection('points').get();
    pointsScanned += pointsSnap.size;

    for (const pointDoc of pointsSnap.docs) {
      const pData = pointDoc.data();
      const pPatch = {};

      if (!pData.creatorId)             pPatch.creatorId = patch.creatorId || data.creatorId || CREATOR_ID_OLD_TOURS;
      if (!pData.tourStatus)            pPatch.tourStatus = 'published';
      if (!('description' in pData))    pPatch.description = '';
      if (!('placeId' in pData))        pPatch.placeId = null;
      if (!('audioStoragePath' in pData)) pPatch.audioStoragePath = null;
      if (!('imageStoragePath' in pData)) pPatch.imageStoragePath = null;
      if (!('audioDuration' in pData))    pPatch.audioDuration = null;
      if (!('audioSizeBytes' in pData))   pPatch.audioSizeBytes = null;
      if (!pData.createdAt) pPatch.createdAt = admin.firestore.FieldValue.serverTimestamp();
      if (!pData.updatedAt) pPatch.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      if (Object.keys(pPatch).length > 0) {
        console.log(`     └ point ${pointDoc.id}: ${Object.keys(pPatch).join(', ')}`);
        if (!DRY_RUN) await pointDoc.ref.update(pPatch);
        pointsUpdated++;
      }
    }
  }

  console.log(`\n✅ Resumen:`);
  console.log(`   Tours escaneados:   ${toursSnap.size}`);
  console.log(`   Tours actualizados: ${toursUpdated}`);
  console.log(`   Points escaneados:  ${pointsScanned}`);
  console.log(`   Points actualizados: ${pointsUpdated}`);
  if (DRY_RUN) console.log(`\n⚠️  DRY RUN: no se escribió nada. Quita --dry-run para aplicar.\n`);
}

async function main() {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  console.log(`\n🚀 Migración tours (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);
  console.log(`   Project: ${serviceAccount.project_id}`);

  await migrateTours(db);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Error en la migración:', err);
  process.exit(1);
});
