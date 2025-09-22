import { useState, useEffect } from "react";
import { AvatarDirection, getAvatarImageUrl } from "../types/avatar";

export interface UseAvatarAssetsResult {
  images: Map<string, HTMLImageElement>;
  loading: boolean;
  error: string | null;
}

export const useAvatarAssets = (avatarId: number): UseAvatarAssetsResult => {
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      setError(null);
      const newImages = new Map<string, HTMLImageElement>();

      try {
        const directions = Object.values(AvatarDirection).filter(
          (value): value is AvatarDirection => typeof value === "number"
        );

        const loadPromises = directions.map((direction) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            const key = `${avatarId}_${direction}`;

            img.onload = () => {
              newImages.set(key, img);
              resolve();
            };

            img.onerror = () => {
              reject(
                new Error(
                  `Failed to load avatar image: ${getAvatarImageUrl(
                    avatarId,
                    direction
                  )}`
                )
              );
            };

            // img.crossOrigin = 'anonymous';
            img.src = getAvatarImageUrl(avatarId, direction);
          });
        });

        await Promise.all(loadPromises);
        setImages(newImages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [avatarId]);

  return { images, loading, error };
};
