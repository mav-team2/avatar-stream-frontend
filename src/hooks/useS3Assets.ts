import { useState, useCallback, useRef } from 'react';

export interface S3AssetMetadata {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  framesPerRow: number;
  animationSpeed: number;
}

export interface S3Asset {
  image: HTMLImageElement;
  metadata: S3AssetMetadata;
}

export interface UseS3AssetsState {
  assets: Map<string, S3Asset>;
  loading: Set<string>;
  errors: Map<string, string>;
}

export interface UseS3AssetsReturn {
  assets: Map<string, S3Asset>;
  loadAsset: (key: string, imageUrl: string, metadataUrl?: string) => Promise<S3Asset>;
  isLoading: (key: string) => boolean;
  getError: (key: string) => string | undefined;
  clearCache: () => void;
}

const DEFAULT_METADATA: S3AssetMetadata = {
  frameWidth: 32,
  frameHeight: 32,
  frameCount: 4,
  framesPerRow: 4,
  animationSpeed: 200,
};

export const useS3Assets = (): UseS3AssetsReturn => {
  const [state, setState] = useState<UseS3AssetsState>({
    assets: new Map(),
    loading: new Set(),
    errors: new Map(),
  });

  const cacheRef = useRef<Map<string, Promise<S3Asset>>>(new Map());

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      img.src = url;
    });
  }, []);

  const loadMetadata = useCallback(async (url: string): Promise<S3AssetMetadata> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      const metadata = await response.json();
      return { ...DEFAULT_METADATA, ...metadata };
    } catch (error) {
      console.warn(`Failed to load metadata from ${url}, using defaults:`, error);
      return DEFAULT_METADATA;
    }
  }, []);

  const loadAsset = useCallback(async (
    key: string,
    imageUrl: string,
    metadataUrl?: string
  ): Promise<S3Asset> => {
    if (state.assets.has(key)) {
      return state.assets.get(key)!;
    }

    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }

    const loadPromise = (async () => {
      setState(prev => ({
        ...prev,
        loading: new Set(prev.loading).add(key),
        errors: new Map([...prev.errors].filter(([k]) => k !== key)),
      }));

      try {
        const [image, metadata] = await Promise.all([
          loadImage(imageUrl),
          metadataUrl ? loadMetadata(metadataUrl) : Promise.resolve(DEFAULT_METADATA),
        ]);

        const asset: S3Asset = { image, metadata };

        setState(prev => {
          const newAssets = new Map(prev.assets);
          const newLoading = new Set(prev.loading);
          newAssets.set(key, asset);
          newLoading.delete(key);

          return {
            ...prev,
            assets: newAssets,
            loading: newLoading,
          };
        });

        cacheRef.current.delete(key);
        return asset;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setState(prev => {
          const newLoading = new Set(prev.loading);
          const newErrors = new Map(prev.errors);
          newLoading.delete(key);
          newErrors.set(key, errorMessage);

          return {
            ...prev,
            loading: newLoading,
            errors: newErrors,
          };
        });

        cacheRef.current.delete(key);
        throw error;
      }
    })();

    cacheRef.current.set(key, loadPromise);
    return loadPromise;
  }, [state.assets, loadImage, loadMetadata]);

  const isLoading = useCallback((key: string): boolean => {
    return state.loading.has(key);
  }, [state.loading]);

  const getError = useCallback((key: string): string | undefined => {
    return state.errors.get(key);
  }, [state.errors]);

  const clearCache = useCallback(() => {
    setState({
      assets: new Map(),
      loading: new Set(),
      errors: new Map(),
    });
    cacheRef.current.clear();
  }, []);

  return {
    assets: state.assets,
    loadAsset,
    isLoading,
    getError,
    clearCache,
  };
};