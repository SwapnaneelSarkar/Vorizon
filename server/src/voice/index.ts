import { env } from '../config/env.js';
import { ExotelVoiceEngine } from './ExotelVoiceEngine.js';
import { MockVoiceEngine } from './MockVoiceEngine.js';
import { RetellVoiceEngine } from './RetellVoiceEngine.js';
import type { VoiceEngine } from './VoiceEngine.js';

let engine: VoiceEngine | null = null;

/** Factory: returns the configured VoiceEngine (VOICE_PROVIDER). */
export function getVoiceEngine(): VoiceEngine {
  if (engine) return engine;
  switch (env.VOICE_PROVIDER) {
    case 'retell':
      engine = new RetellVoiceEngine();
      return engine;
    case 'exotel':
      engine = new ExotelVoiceEngine();
      return engine;
    case 'vapi':
      throw new Error('Vapi voice engine not implemented (use retell, exotel or mock)');
    case 'mock':
    default:
      engine = new MockVoiceEngine();
      return engine;
  }
}

export type { VoiceEngine, CallEvent, InterviewContext, OutboundCallParams } from './VoiceEngine.js';
