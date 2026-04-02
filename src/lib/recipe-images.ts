export const RECIPE_UPLOAD_PUBLIC_PATH = '/uploads/recipes';
const RECIPE_INLINE_IMAGE_PREFIX = 'data:image/';

export function isUploadedRecipeImage(
  imageUrl: string | null | undefined,
): boolean {
  return Boolean(
    imageUrl && imageUrl.startsWith(RECIPE_UPLOAD_PUBLIC_PATH),
  );
}

export function isInlineRecipeImage(
  imageUrl: string | null | undefined,
): boolean {
  return Boolean(
    imageUrl && imageUrl.startsWith(RECIPE_INLINE_IMAGE_PREFIX),
  );
}

export function isRecipeFileSourceImage(
  imageUrl: string | null | undefined,
): boolean {
  return isUploadedRecipeImage(imageUrl) || isInlineRecipeImage(imageUrl);
}
