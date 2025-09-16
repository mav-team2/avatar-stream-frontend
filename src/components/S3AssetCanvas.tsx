import React, { useEffect, useState, useMemo } from 'react';
import { EntityCanvas, EntityData } from './EntityCanvas';
import { useS3Assets } from '../hooks/useS3Assets';

export interface S3AssetEntity {
  id: string;
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  width: number;
  height: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  assetKey: string;
}

export interface S3AssetDefinition {
  key: string;
  imageUrl: string;
  metadataUrl?: string;
}

export interface S3AssetCanvasProps {
  assets: S3AssetDefinition[];
  entities: S3AssetEntity[];
  className?: string;
  style?: React.CSSProperties;
  onAssetLoaded?: (key: string) => void;
  onAssetError?: (key: string, error: string) => void;
  onAllAssetsLoaded?: () => void;
}

export const S3AssetCanvas: React.FC<S3AssetCanvasProps> = ({
  assets,
  entities,
  className,
  style,
  onAssetLoaded,
  onAssetError,
  onAllAssetsLoaded
}) => {
  const { loadAsset, isLoading, getError } = useS3Assets();
  const [loadedAssets, setLoadedAssets] = useState<Map<string, number>>(new Map());
  const [imageMap, setImageMap] = useState<Map<number, HTMLImageElement>>(new Map());
  const [nextImageId, setNextImageId] = useState<number>(1);

  // Load assets from S3
  useEffect(() => {
    const loadAllAssets = async () => {
      const newLoadedAssets = new Map<string, number>();
      const newImageMap = new Map<number, HTMLImageElement>();
      let currentImageId = 1;

      for (const asset of assets) {
        if (loadedAssets.has(asset.key)) {
          newLoadedAssets.set(asset.key, loadedAssets.get(asset.key)!);
          continue;
        }

        try {
          const s3Asset = await loadAsset(asset.key, asset.imageUrl, asset.metadataUrl);
          const imageId = currentImageId++;

          newLoadedAssets.set(asset.key, imageId);
          newImageMap.set(imageId, s3Asset.image);

          onAssetLoaded?.(asset.key);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          onAssetError?.(asset.key, errorMessage);
        }
      }

      setLoadedAssets(newLoadedAssets);
      setImageMap(prev => new Map([...prev, ...newImageMap]));
      setNextImageId(currentImageId);

      // Check if all assets are loaded
      if (newLoadedAssets.size === assets.length) {
        onAllAssetsLoaded?.();
      }
    };

    if (assets.length > 0) {
      loadAllAssets();
    }
  }, [assets, loadAsset, onAssetLoaded, onAssetError, onAllAssetsLoaded]);

  // Convert S3AssetEntity to EntityData
  const entityData = useMemo<EntityData[]>(() => {
    return entities
      .filter(entity => loadedAssets.has(entity.assetKey))
      .map(entity => {
        const imageId = loadedAssets.get(entity.assetKey)!;
        return {
          x: entity.x,
          y: entity.y,
          scaleX: entity.scaleX,
          scaleY: entity.scaleY,
          rotation: entity.rotation,
          imageId,
          width: entity.width,
          height: entity.height,
          sourceX: entity.sourceX,
          sourceY: entity.sourceY,
          sourceWidth: entity.sourceWidth,
          sourceHeight: entity.sourceHeight
        };
      });
  }, [entities, loadedAssets]);

  // Show loading or error states
  const hasLoadingAssets = assets.some(asset => isLoading(asset.key));
  const errorAssets = assets.filter(asset => getError(asset.key)).map(asset => ({
    key: asset.key,
    error: getError(asset.key)!
  }));

  if (hasLoadingAssets) {
    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          color: 'white',
          fontSize: '18px',
          ...style
        }}
      >
        Loading assets...
      </div>
    );
  }

  if (errorAssets.length > 0) {
    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: 'red',
          fontSize: '16px',
          flexDirection: 'column',
          ...style
        }}
      >
        <div>Failed to load assets:</div>
        {errorAssets.map(({ key, error }) => (
          <div key={key}>
            {key}: {error}
          </div>
        ))}
      </div>
    );
  }

  return (
    <EntityCanvas
      entities={entityData}
      images={imageMap}
      className={className}
      style={style}
    />
  );
};