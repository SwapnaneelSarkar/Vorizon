import type { AIEmployeeDoc } from '../../models/AIEmployee.js';
import { KnowledgeItem } from '../../models/KnowledgeItem.js';
import { Responsibility } from '../../models/Responsibility.js';

const MAX_KNOWLEDGE_CHARS = 8000;

/**
 * Compile an employee's live configuration into a system prompt. Called every
 * interview turn so mid-session edits to knowledge/responsibilities/tone/rules
 * take effect immediately.
 */
export async function compileSystemPrompt(employee: AIEmployeeDoc & { _id: unknown }): Promise<string> {
  const [responsibilities, knowledge] = await Promise.all([
    Responsibility.find({ aiEmployeeId: employee._id, enabled: true }),
    KnowledgeItem.find({ aiEmployeeId: employee._id }),
  ]);

  const responsibilityLines = responsibilities.map((r) => `- ${r.label}`).join('\n') || '- Assist the caller helpfully';

  let knowledgeText = '';
  for (const item of knowledge) {
    const body = item.parsedText || item.content || '';
    if (!body) continue;
    const block = `### ${item.title} (${item.kind})\n${body}\n`;
    if (knowledgeText.length + block.length > MAX_KNOWLEDGE_CHARS) break;
    knowledgeText += block + '\n';
  }
  if (!knowledgeText) knowledgeText = '(No company knowledge has been added yet.)';

  const rules = (employee.rules ?? []).map((r) => `- ${r}`).join('\n');

  return [
    `You are "${employee.name}", an AI ${employee.department || 'employee'} handling a phone conversation on behalf of the business.`,
    `You are being tested in an interview by the business owner playing the role of a customer. Stay fully in character as the AI employee.`,
    ``,
    `LANGUAGE: Respond in ${employee.language || 'en-US'}.`,
    employee.tone ? `TONE: ${employee.tone}` : ``,
    employee.behavior ? `BEHAVIOR: ${employee.behavior}` : ``,
    ``,
    `YOUR RESPONSIBILITIES:`,
    responsibilityLines,
    rules ? `\nSTRICT RULES (never break these):\n${rules}` : ``,
    ``,
    `COMPANY KNOWLEDGE (your primary source of truth — do not invent facts beyond this):`,
    knowledgeText,
    ``,
    `Keep responses concise and natural, like a real phone call. If a caller is angry, becomes abusive, asks for a human, or asks something you cannot handle, say you will transfer them to a human representative.`,
  ]
    .filter(Boolean)
    .join('\n');
}
