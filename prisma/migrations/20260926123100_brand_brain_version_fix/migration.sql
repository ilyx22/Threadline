-- Correct the Brand Brain version trigger: appending to a text[] with "||"
-- and an untyped literal parses the literal as an array and fails, so every
-- content edit was refused. array_append takes the element explicitly.
CREATE OR REPLACE FUNCTION "brand_brain_version_bump"() RETURNS trigger AS $$
DECLARE
  changed text[] := ARRAY[]::text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."company" IS DISTINCT FROM OLD."company" THEN changed := array_append(changed, 'company'); END IF;
    IF NEW."founder" IS DISTINCT FROM OLD."founder" THEN changed := array_append(changed, 'founder'); END IF;
    IF NEW."voice" IS DISTINCT FROM OLD."voice" THEN changed := array_append(changed, 'voice'); END IF;
    IF NEW."contentRules" IS DISTINCT FROM OLD."contentRules" THEN changed := array_append(changed, 'contentRules'); END IF;
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
