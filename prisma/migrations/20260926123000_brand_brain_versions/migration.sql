-- AlterTable
ALTER TABLE "AiGeneration" ADD COLUMN     "brainVersion" INTEGER;

-- AlterTable
ALTER TABLE "BrandBrain" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ScriptVersion" ADD COLUMN     "brainVersion" INTEGER;

-- CreateTable
CREATE TABLE "BrandBrainVersion" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "founder" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "contentRules" TEXT NOT NULL,
    "changed" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandBrainVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandBrainVersion_orgId_version_key" ON "BrandBrainVersion"("orgId", "version");


-- AI-03/ENG-04: version every change to the Brand Brain, whichever code path
-- writes it, and keep each version's content.
CREATE OR REPLACE FUNCTION "brand_brain_version_bump"() RETURNS trigger AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."company" IS DISTINCT FROM OLD."company" THEN changed := changed || 'company'; END IF;
    IF NEW."founder" IS DISTINCT FROM OLD."founder" THEN changed := changed || 'founder'; END IF;
    IF NEW."voice" IS DISTINCT FROM OLD."voice" THEN changed := changed || 'voice'; END IF;
    IF NEW."contentRules" IS DISTINCT FROM OLD."contentRules" THEN changed := changed || 'contentRules'; END IF;
    IF array_length(changed, 1) IS NULL THEN
      NEW."version" := OLD."version";
      RETURN NEW;
    END IF;
    NEW."version" := OLD."version" + 1;
  END IF;
  INSERT INTO "BrandBrainVersion" ("id", "orgId", "version", "company", "founder", "voice", "contentRules", "changed")
  VALUES (gen_random_uuid()::text, NEW."orgId", NEW."version", NEW."company", NEW."founder", NEW."voice", NEW."contentRules", to_json(changed)::text)
  ON CONFLICT ("orgId", "version") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "brand_brain_version_bump"
BEFORE INSERT OR UPDATE ON "BrandBrain"
FOR EACH ROW EXECUTE FUNCTION "brand_brain_version_bump"();

-- Version 1 of every existing Brand Brain.
INSERT INTO "BrandBrainVersion" ("id", "orgId", "version", "company", "founder", "voice", "contentRules", "changed")
SELECT gen_random_uuid()::text, "orgId", "version", "company", "founder", "voice", "contentRules", '[]' FROM "BrandBrain"
ON CONFLICT ("orgId", "version") DO NOTHING;
