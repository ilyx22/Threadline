-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "rootId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'upload',
ADD COLUMN     "sourceNote" TEXT;


-- Existing links and exports keep an honest source.
UPDATE "Asset" SET "source" = 'link' WHERE "externalUrl" IS NOT NULL AND "storagePath" IS NULL;
UPDATE "Asset" SET "source" = 'export' WHERE "tags" LIKE '%"export"%';
