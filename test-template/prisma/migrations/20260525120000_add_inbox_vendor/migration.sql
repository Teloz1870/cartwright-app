-- AlterTable: add nullable inboxVendor to BrandingSettings.
-- Nullable so existing rows remain valid; UI defaults to "ikke valgt".
ALTER TABLE "BrandingSettings" ADD COLUMN "inboxVendor" TEXT;
