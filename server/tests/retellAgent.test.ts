import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env.js';
import { AIEmployee } from '../src/models/AIEmployee.js';
import { KnowledgeItem } from '../src/models/KnowledgeItem.js';
import { Responsibility } from '../src/models/Responsibility.js';
import { compileSystemPrompt } from '../src/modules/interview/promptCompiler.js';
import { RetellClient } from '../src/voice/retellClient.js';
import { RetellVoiceEngine } from '../src/voice/RetellVoiceEngine.js';

const ORG = '6a99000000000000000000aa';

// The RetellClient requires an API key at construction. In a full-suite run an
// earlier file's setup has already populated it; ensure it's set for isolated runs too.
env.RETELL_API_KEY = env.RETELL_API_KEY || 'test-retell-key';

async function makeEmployee() {
  const emp = await AIEmployee.create({
    organizationId: ORG,
    type: 'outbound',
    name: 'Riya',
    department: 'Sales',
    language: 'en',
    voice: 'female-1',
    tone: 'warm and concise',
    rules: ['Never quote a price'],
  });
  await KnowledgeItem.create({
    organizationId: ORG,
    aiEmployeeId: emp._id,
    kind: 'description',
    title: 'About',
    content: 'We sell premium espresso machines.',
    parsedText: 'We sell premium espresso machines.',
  });
  await Responsibility.create({ organizationId: ORG, aiEmployeeId: emp._id, label: 'Book product demos', kind: 'preset', enabled: true });
  return emp;
}

afterEach(() => vi.restoreAllMocks());

describe('production prompt compiler', () => {
  it('drops the interview framing and includes the employee brain for real calls', async () => {
    const emp = await makeEmployee();
    const prod = await compileSystemPrompt(emp, 'production');
    expect(prod).toContain('real customer'); // production framing
    expect(prod).not.toContain('being tested'); // never ship the interview framing
    expect(prod).toContain('premium espresso machines'); // knowledge
    expect(prod).toContain('Book product demos'); // responsibilities
    expect(prod).toContain('Never quote a price'); // rules

    const interview = await compileSystemPrompt(emp, 'interview');
    expect(interview).toContain('being tested'); // interview keeps its framing
  });
});

describe('RetellVoiceEngine.syncAssistant', () => {
  it("builds a per-employee LLM + agent from the employee's config and persists the ids", async () => {
    const emp = await makeEmployee();
    const createLlm = vi.spyOn(RetellClient.prototype, 'createRetellLlm').mockResolvedValue({ llm_id: 'llm_1' });
    const createAgent = vi.spyOn(RetellClient.prototype, 'createAgent').mockResolvedValue({ agent_id: 'agent_1' });

    const engine = new RetellVoiceEngine();
    const res = await engine.syncAssistant(String(emp._id));
    expect(res.assistantId).toBe('agent_1');

    // The LLM carries the production prompt built from THIS employee's brain.
    const prompt = createLlm.mock.calls[0][0].general_prompt;
    expect(prompt).toContain('premium espresso machines');
    expect(prompt).toContain('Book product demos');
    expect(prompt).not.toContain('being tested');
    // The agent is bound to that LLM.
    expect(createAgent).toHaveBeenCalledWith(expect.objectContaining({ response_engine: { type: 'retell-llm', llm_id: 'llm_1' } }));

    // Ids are persisted so a re-sync updates the same objects.
    const fresh = await AIEmployee.findById(emp._id);
    expect(fresh?.assistantExternalId).toBe('agent_1');
    expect(fresh?.assistantLlmId).toBe('llm_1');
    expect(fresh?.voiceProvider).toBe('retell');
  });

  it('updates the existing LLM + agent on re-sync instead of creating new ones', async () => {
    const emp = await makeEmployee();
    await AIEmployee.updateOne({ _id: emp._id }, { $set: { assistantLlmId: 'llm_1', assistantExternalId: 'agent_1' } });
    const createLlm = vi.spyOn(RetellClient.prototype, 'createRetellLlm');
    const updateLlm = vi.spyOn(RetellClient.prototype, 'updateRetellLlm').mockResolvedValue({ llm_id: 'llm_1' });
    const updateAgent = vi.spyOn(RetellClient.prototype, 'updateAgent').mockResolvedValue({ agent_id: 'agent_1' });

    const res = await new RetellVoiceEngine().syncAssistant(String(emp._id));
    expect(res.assistantId).toBe('agent_1');
    expect(createLlm).not.toHaveBeenCalled();
    expect(updateLlm).toHaveBeenCalledWith('llm_1', expect.objectContaining({ general_prompt: expect.stringContaining('espresso') }));
    expect(updateAgent).toHaveBeenCalledWith('agent_1', expect.objectContaining({ agent_name: 'Riya' }));
  });
});

describe('RetellVoiceEngine.startOutboundCall', () => {
  it("dials through THIS employee's agent id, not a shared one", async () => {
    const saved = env.RETELL_FROM_NUMBER;
    env.RETELL_FROM_NUMBER = '+18005550100';
    const createCall = vi.spyOn(RetellClient.prototype, 'createPhoneCall').mockResolvedValue({ call_id: 'call_1' });
    try {
      const engine = new RetellVoiceEngine();
      const res = await engine.startOutboundCall({
        organizationId: ORG,
        aiEmployeeId: 'emp_1',
        campaignId: 'camp_1',
        contactId: 'contact_1',
        contactName: 'Alice',
        to: '+14155551234',
        disclosure: 'This call may be recorded.',
        agentId: 'agent_specific',
      });
      expect(res.externalCallId).toBe('call_1');
      expect(createCall).toHaveBeenCalledWith(expect.objectContaining({ override_agent_id: 'agent_specific', to_number: '+14155551234' }));
    } finally {
      env.RETELL_FROM_NUMBER = saved;
    }
  });
});
