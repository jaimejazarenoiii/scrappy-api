-- Trip load is always enabled; optional load is represented by TripLoad presence, not the flag.
ALTER TABLE "Trip" ALTER COLUMN "loadEnabled" SET DEFAULT true;
UPDATE "Trip" SET "loadEnabled" = true WHERE "loadEnabled" = false;
