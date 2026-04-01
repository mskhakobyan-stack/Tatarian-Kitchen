-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM (
  'VEGETABLE',
  'FRUIT',
  'MEAT',
  'DAIRY',
  'GRAIN',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM (
  'GRAM',
  'KILOGRAM',
  'LITER',
  'MILLILITER',
  'PIECE'
);

-- CreateTable
CREATE TABLE "public"."users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ingredients" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "public"."Category" NOT NULL,
  "unit" "public"."Unit" NOT NULL,
  "price" DOUBLE PRECISION,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recipe" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT,

  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recipe_ingredients" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."recipe_ingredients"
ADD CONSTRAINT "recipe_ingredients_recipeId_fkey"
FOREIGN KEY ("recipeId")
REFERENCES "public"."Recipe"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipe_ingredients"
ADD CONSTRAINT "recipe_ingredients_ingredientId_fkey"
FOREIGN KEY ("ingredientId")
REFERENCES "public"."ingredients"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
