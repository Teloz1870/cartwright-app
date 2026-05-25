-- Voice-plan Fase 1.1: voice-shop-konfiguration på IntegrationSettings.
-- AuditLog-felter (provider/model/modality/sessionMinutes) blev allerede
-- tilføjet i Local-AI migrationen — denne migration tilføjer KUN voice-shop
-- specifik config. googleGeminiApiKey kolonnen findes også allerede.

ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopEnabled" BOOLEAN DEFAULT 0;
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopModel" TEXT DEFAULT 'gemini-2.5-flash-live';
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopVoice" TEXT DEFAULT 'Puck';
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopAllowedToolsJson" TEXT;
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopMaxMinutesPerSession" INTEGER DEFAULT 5;
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopMaxMinutesPerDay" INTEGER DEFAULT 60;
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopVisionEnabled" BOOLEAN DEFAULT 1;
ALTER TABLE "IntegrationSettings" ADD COLUMN "voiceShopLastDailyUsageJson" TEXT;
