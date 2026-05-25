-- Local-AI plan (Ollama/Gemma): provider-agnostic chatModel routing + audit tracking.
-- Consolidated with Voice-plan's needs so a single migration covers both:
--   - IntegrationSettings gains aiProvider/anthropicModel/localAi*/aiUsage fields
--   - AuditLog gains provider/model/modality/sessionMinutes so Voice rows can be
--     filtered later without another migration.

-- IntegrationSettings — AI provider config + cost accounting
ALTER TABLE "IntegrationSettings" ADD COLUMN "aiProvider" TEXT DEFAULT 'anthropic';
ALTER TABLE "IntegrationSettings" ADD COLUMN "anthropicModel" TEXT DEFAULT 'claude-haiku-4-5';
ALTER TABLE "IntegrationSettings" ADD COLUMN "localAiEndpoint" TEXT;
ALTER TABLE "IntegrationSettings" ADD COLUMN "localAiModel" TEXT;
ALTER TABLE "IntegrationSettings" ADD COLUMN "localAiFallbackMode" TEXT DEFAULT 'on-error';
ALTER TABLE "IntegrationSettings" ADD COLUMN "lastDegradedAt" DATETIME;
ALTER TABLE "IntegrationSettings" ADD COLUMN "lastModelDetectedAt" DATETIME;
ALTER TABLE "IntegrationSettings" ADD COLUMN "aiUsageJson" TEXT;

-- AuditLog — provider/model/modality tracking (Voice-plan reuses sessionMinutes)
ALTER TABLE "AuditLog" ADD COLUMN "provider" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "model" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "modality" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "sessionMinutes" REAL;

-- Backfill existing AuditLog rows with sensible defaults so reporting queries
-- don't see NULL for the historical baseline (pre-tracking text-based runs
-- were all Anthropic via the hardcoded CHAT_MODEL).
UPDATE "AuditLog" SET "provider" = 'anthropic', "modality" = 'text' WHERE "provider" IS NULL;

CREATE INDEX "AuditLog_provider_idx" ON "AuditLog"("provider");
