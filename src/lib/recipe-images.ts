export const RECIPE_UPLOAD_PUBLIC_PATH = '/uploads/recipes';

export function isUploadedRecipeImage(
  imageUrl: string | null | undefined,
): boolean {
  return Boolean(
    imageUrl && imageUrl.startsWith(RECIPE_UPLOAD_PUBLIC_PATH),
  );
}
