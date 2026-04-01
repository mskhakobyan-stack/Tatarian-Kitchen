-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipeId_ingredientId_key"
ON "public"."recipe_ingredients"("recipeId", "ingredientId");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredientId_idx"
ON "public"."recipe_ingredients"("ingredientId");
