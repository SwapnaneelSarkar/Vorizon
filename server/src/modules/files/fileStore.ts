import { getDb } from '../../config/firebase.js';
import { logger } from '../../utils/logger.js';

const FILES = 'files';
const CHUNKS = 'chunks';
/** Firestore docs cap at ~1 MiB; keep chunks comfortably under with room for field overhead. */
const CHUNK_BYTES = 750 * 1024;

export interface StoredFileMeta {
  organizationId: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
}

/**
 * Raw upload storage in Firestore (in place of an S3 bucket). Each file is a
 * doc in `files` holding metadata, with the bytes split across a `chunks`
 * subcollection to stay under Firestore's 1 MiB document limit.
 */

/** Persist an uploaded file. Returns the Firestore file id, or null when Firebase is off. */
export async function saveFile(buffer: Buffer, meta: StoredFileMeta): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const fileRef = db.collection(FILES).doc();
  const chunkCount = Math.max(1, Math.ceil(buffer.length / CHUNK_BYTES));
  const batch = db.batch();
  batch.set(fileRef, { ...meta, chunkCount, createdAt: Date.now() });
  for (let i = 0; i < chunkCount; i++) {
    batch.set(fileRef.collection(CHUNKS).doc(String(i)), {
      i,
      data: buffer.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES),
    });
  }
  await batch.commit();
  return fileRef.id;
}

/** Read a stored file back into a single buffer. Null if Firebase is off or the file is gone. */
export async function readFile(fileId: string): Promise<{ meta: StoredFileMeta; buffer: Buffer } | null> {
  const db = getDb();
  if (!db) return null;
  const fileRef = db.collection(FILES).doc(fileId);
  const snap = await fileRef.get();
  if (!snap.exists) return null;
  const meta = snap.data() as StoredFileMeta;
  const chunks = await fileRef.collection(CHUNKS).orderBy('i').get();
  return { meta, buffer: Buffer.concat(chunks.docs.map((d) => Buffer.from(d.get('data') as Uint8Array))) };
}

/** Best-effort delete of a stored file and its chunks. */
export async function deleteFile(fileId: string | null | undefined): Promise<void> {
  const db = getDb();
  if (!db || !fileId) return;
  try {
    const fileRef = db.collection(FILES).doc(fileId);
    const chunks = await fileRef.collection(CHUNKS).get();
    const batch = db.batch();
    chunks.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(fileRef);
    await batch.commit();
  } catch (err) {
    logger.warn({ err, fileId }, 'Failed to delete stored file');
  }
}
