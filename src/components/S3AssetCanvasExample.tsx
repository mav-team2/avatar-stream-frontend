import React, { useState, useEffect } from 'react';
import { S3AssetCanvas, S3AssetDefinition, S3AssetEntity } from './S3AssetCanvas';

export const S3AssetCanvasExample: React.FC = () => {
  const [entities, setEntities] = useState<S3AssetEntity[]>([]);
  const [loadedAssets, setLoadedAssets] = useState<Set<string>>(new Set());

  // Example S3 assets - replace with your actual S3 URLs
  const assets: S3AssetDefinition[] = [
    {
      key: 'avatar1',
      imageUrl: 'https://your-bucket.s3.region.amazonaws.com/avatars/sprite1.png',
      metadataUrl: 'https://your-bucket.s3.region.amazonaws.com/avatars/sprite1-meta.json'
    },
    {
      key: 'avatar2',
      imageUrl: 'https://your-bucket.s3.region.amazonaws.com/avatars/sprite2.png'
    }
  ];

  // Create some example entities once assets are loaded
  useEffect(() => {
    if (loadedAssets.size === assets.length) {
      const exampleEntities: S3AssetEntity[] = [
        {
          id: 'entity1',
          x: 200,
          y: 300,
          width: 64,
          height: 64,
          scaleX: 1.5,
          scaleY: 1.5,
          rotation: 0,
          assetKey: 'avatar1'
        },
        {
          id: 'entity2',
          x: 400,
          y: 200,
          width: 32,
          height: 32,
          scaleX: 2,
          scaleY: 2,
          rotation: Math.PI / 4, // 45 degrees
          assetKey: 'avatar2'
        },
        {
          id: 'entity3',
          x: 600,
          y: 400,
          width: 48,
          height: 48,
          assetKey: 'avatar1'
        }
      ];

      setEntities(exampleEntities);
    }
  }, [loadedAssets, assets.length]);

  // Animate entities position
  useEffect(() => {
    const interval = setInterval(() => {
      setEntities(prev => prev.map(entity => ({
        ...entity,
        x: entity.x + Math.sin(Date.now() / 1000 + parseInt(entity.id.slice(-1))) * 2,
        y: entity.y + Math.cos(Date.now() / 1000 + parseInt(entity.id.slice(-1))) * 2,
        rotation: (entity.rotation || 0) + 0.02
      })));
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, []);

  const handleAssetLoaded = (key: string) => {
    console.log(`Asset loaded: ${key}`);
    setLoadedAssets(prev => new Set([...prev, key]));
  };

  const handleAssetError = (key: string, error: string) => {
    console.error(`Failed to load asset ${key}:`, error);
  };

  const handleAllAssetsLoaded = () => {
    console.log('All assets loaded successfully!');
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, #1e3c72, #2a5298)',
          zIndex: 0
        }}
      />

      {/* Info overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          color: 'white',
          fontSize: '16px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px'
        }}
      >
        <div>S3 Asset Canvas Example</div>
        <div>Loaded assets: {loadedAssets.size}/{assets.length}</div>
        <div>Active entities: {entities.length}</div>
      </div>

      {/* S3AssetCanvas */}
      <S3AssetCanvas
        assets={assets}
        entities={entities}
        onAssetLoaded={handleAssetLoaded}
        onAssetError={handleAssetError}
        onAllAssetsLoaded={handleAllAssetsLoaded}
        style={{ zIndex: 5 }}
      />
    </div>
  );
};