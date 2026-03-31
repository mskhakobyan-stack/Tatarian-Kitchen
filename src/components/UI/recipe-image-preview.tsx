/* eslint-disable @next/next/no-img-element */

interface RecipeImagePreviewProps {
  alt: string;
  emptyMessage?: string;
  imageUrl?: string;
}

export function RecipeImagePreview({
  alt,
  emptyMessage = 'Предпросмотр изображения появится здесь.',
  imageUrl,
}: RecipeImagePreviewProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#eadbcc] bg-[#fffdfa]/70 shadow-[0_18px_30px_-28px_rgba(96,53,11,0.3)]">
      {imageUrl ? (
        <img
          alt={alt}
          className="aspect-[4/3] h-full w-full object-cover"
          loading="lazy"
          src={imageUrl}
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-sm leading-6 text-[#9b7855]">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
