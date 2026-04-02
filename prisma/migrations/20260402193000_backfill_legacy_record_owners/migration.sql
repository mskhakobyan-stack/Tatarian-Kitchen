DO $$
DECLARE
  target_user_id TEXT;
BEGIN
  SELECT "id"
  INTO target_user_id
  FROM "users"
  WHERE "email" = 'misak.hakobyan@mail.ru'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION
      'Cannot backfill owner_id: user with email % was not found.',
      'misak.hakobyan@mail.ru';
  END IF;

  UPDATE "ingredients"
  SET "owner_id" = target_user_id
  WHERE "owner_id" IS NULL;

  UPDATE "Recipe"
  SET "owner_id" = target_user_id
  WHERE "owner_id" IS NULL;
END $$;
