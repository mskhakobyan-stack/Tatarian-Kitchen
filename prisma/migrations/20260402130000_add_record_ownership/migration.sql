ALTER TABLE "ingredients"
ADD COLUMN "owner_id" TEXT;

ALTER TABLE "Recipe"
ADD COLUMN "owner_id" TEXT;

ALTER TABLE "ingredients"
ADD CONSTRAINT "ingredients_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Recipe"
ADD CONSTRAINT "Recipe_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "ingredients_owner_id_idx" ON "ingredients"("owner_id");
CREATE INDEX "Recipe_owner_id_idx" ON "Recipe"("owner_id");
