import type { InterviewMessageInput, InterviewReply } from '@vorizon/shared';
import { InterviewSession } from '../../models/InterviewSession.js';
import { ApiError } from '../../utils/apiError.js';
import { getVoiceEngine } from '../../voice/index.js';
import { loadEmployee } from '../aiEmployees/aiEmployees.service.js';
import { compileSystemPrompt } from './promptCompiler.js';

export async function sendInterviewMessage(
  orgId: string,
  employeeId: string,
  input: InterviewMessageInput,
): Promise<InterviewReply> {
  const employee = await loadEmployee(orgId, employeeId);

  let session = input.sessionId
    ? await InterviewSession.findOne({ _id: input.sessionId, organizationId: orgId })
    : null;
  if (input.sessionId && !session) throw ApiError.notFound('Interview session not found');
  if (!session) {
    session = await InterviewSession.create({
      organizationId: orgId,
      aiEmployeeId: employee._id,
      messages: [],
    });
  }

  // Recompile the prompt each turn so live config edits are reflected immediately.
  const systemPrompt = await compileSystemPrompt(employee);
  const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

  const { reply } = await getVoiceEngine().interviewTurn({
    systemPrompt,
    history,
    message: input.message,
    language: employee.language ?? 'en-US',
  });

  session.messages.push({ role: 'user', content: input.message, at: new Date() });
  session.messages.push({ role: 'assistant', content: reply, at: new Date() });
  await session.save();

  return { sessionId: String(session._id), reply };
}

export async function getSession(orgId: string, employeeId: string, sessionId: string) {
  const session = await InterviewSession.findOne({
    _id: sessionId,
    organizationId: orgId,
    aiEmployeeId: employeeId,
  });
  if (!session) throw ApiError.notFound('Interview session not found');
  return {
    sessionId: String(session._id),
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      at: m.at.toISOString(),
    })),
  };
}
