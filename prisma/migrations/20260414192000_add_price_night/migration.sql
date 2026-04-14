ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "priceNight" INTEGER;

UPDATE "Property"
SET "priceNight" = ROUND(("priceMonthly"::numeric) / 30)::int
WHERE "priceNight" IS NULL;

ALTER TABLE "Property" ALTER COLUMN "priceNight" SET NOT NULL;
