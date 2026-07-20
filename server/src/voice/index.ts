import { env } from '../config/env.js';
import { MockVoiceEngine } from './MockVoiceEngine.js';
import type { VoiceEngine } from './VoiceEngine.js';

let engine: VoiceEngine | null = null;

/** Factory: returns the configured VoiceEngine (mock in Phase 1). */
export function getVoiceEngine(): VoiceEngine {
  if (engine) return engine;
  switch (env.VOICE_PROVIDER) {
    case 'vapi':
      // Phase 2: return new VapiVoiceEngine();
      throw new Error('Vapi voice engine not implemented yet (Phase 2)');
    case 'mock':
    default:
      engine = new MockVoiceEngine();
      return engine;
  }
}

export type { VoiceEngine, CallEvent, InterviewContext } from './VoiceEngine.js';
