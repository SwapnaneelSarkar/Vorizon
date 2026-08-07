import type { CreateKnowledgeInput, KnowledgeItemDTO, KnowledgeKind } from '@vorizon/shared';
import { KnowledgeItem, type KnowledgeItemDoc } from '../../models/KnowledgeItem.js';
import { loadEmployee, refreshStatus } from '../aiEmployees/aiEmployees.service.js';
import { deleteFile, saveFile } from '../files/fileStore.js';
import { chunkText, extractText } from './parsers.js';

type KnowledgeRecord = KnowledgeItemDoc & { _id: unknown };

function toDTO(k: KnowledgeRecord): KnowledgeItemDTO {
  return {
    id: String(k._id),
    aiEmployeeId: String(k.aiEmployeeId),
    kind: k.kind,
    title: k.title,
    content: k.content ?? undefined,
    sourceFile: k.sourceFile
      ? {
          originalName: k.sourceFile.originalName ?? '',
          mime: k.sourceFile.mime ?? '',
          sizeBytes: k.sourceFile.sizeBytes ?? 0,
        }
      : undefined,
    parsedTextPreview: k.parsedText ? k.parsedText.slice(0, 280) : undefined,
    createdAt: (k as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}

export async function addTextKnowledge(
  orgId: string,
  employeeId: string,
  input: CreateKnowledgeInput,
): Promise<KnowledgeItemDTO> {
  const employee = await loadEmployee(orgId, employeeId);
  const content = input.content ?? '';
  const item = (await KnowledgeItem.create({
    organizationId: orgId,
    aiEmployeeId: employee._id,
    kind: input.kind,
    title: input.title,
    content,
    parsedText: content,
    chunks: chunkText(content),
  })) as KnowledgeRecord;
  await refreshStatus(employee);
  return toDTO(item);
}

export async function addFileKnowledge(
  orgId: string,
  employeeId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  title?: string,
): Promise<KnowledgeItemDTO> {
  const employee = await loadEmployee(orgId, employeeId);
  const parsedText = await extractText(file.buffer, file.mimetype, file.originalname);
  // Keep the original upload in Firestore (no-op returning null when Firebase is off).
  const firestoreFileId = await saveFile(file.buffer, {
    organizationId: orgId,
    originalName: file.originalname,
    mime: file.mimetype,
    sizeBytes: file.size,
  });
  const item = (await KnowledgeItem.create({
    organizationId: orgId,
    aiEmployeeId: employee._id,
    kind: 'file' as KnowledgeKind,
    title: title || file.originalname,
    sourceFile: {
      firestoreFileId: firestoreFileId ?? undefined,
      mime: file.mimetype,
      originalName: file.originalname,
      sizeBytes: file.size,
    },
    parsedText,
    chunks: chunkText(parsedText),
  })) as KnowledgeRecord;
  await refreshStatus(employee);
  return toDTO(item);
}

export async function listKnowledge(
  orgId: string,
  employeeId: string,
): Promise<KnowledgeItemDTO[]> {
  await loadEmployee(orgId, employeeId);
  const items = await KnowledgeItem.find({ aiEmployeeId: employeeId }).sort({ createdAt: -1 });
  return items.map((i) => toDTO(i as KnowledgeRecord));
}

export async function deleteKnowledge(
  orgId: string,
  employeeId: string,
  knowledgeId: string,
): Promise<void> {
  const employee = await loadEmployee(orgId, employeeId);
  const item = await KnowledgeItem.findOne({ _id: knowledgeId, aiEmployeeId: employeeId });
  if (item) {
    await deleteFile(item.sourceFile?.firestoreFileId);
    await item.deleteOne();
  }
  await refreshStatus(employee);
}
