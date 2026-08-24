import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { CONNECTION_STATUSES, CONNECTOR_PROVIDERS } from '@vorizon/shared';

/**
 * An org's connection to an external platform. OAuth tokens are stored
 * encrypted (see integrations/crypto.ts) — never in plaintext.
 */
const connectionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    provider: { type: String, enum: CONNECTOR_PROVIDERS, required: true },
    status: { type: String, enum: CONNECTION_STATUSES, default: 'connected' },
    accountLabel: { type: String, default: '' },
    // AES-256-GCM ciphertext (iv:tag:data). Never logged, never returned to clients.
    accessTokenEnc: { type: String, default: '' },
    refreshTokenEnc: { type: String, default: '' },
    scopes: { type: [String], default: [] },
    // Provider API base returned with the token (e.g. Zoho's api_domain — .com vs
    // .in data center). Used for subsequent API calls; falls back to a default.
    apiDomain: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    lastError: { type: String, default: '' },
    connectedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

connectionSchema.index({ organizationId: 1, provider: 1 }, { unique: true });

export type ConnectionDoc = InferSchemaType<typeof connectionSchema>;
export const Connection = mongoose.model('Connection', connectionSchema);
