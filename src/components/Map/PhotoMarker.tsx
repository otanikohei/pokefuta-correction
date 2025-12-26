import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Photo } from '../../types/photo';

// 通常のポケふた専用のカスタムアイコン（モンスターボール画像を使用）
const pokefutaIcon = L.icon({
  iconUrl: '/monsterball.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// 新しくアップロードされたマーカー用のハイライトアイコン
const newPokefutaIcon = L.icon({
  iconUrl: '/monsterball.png',
  iconSize: [40, 40], // 少し大きく
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'new-marker-highlight', // CSSクラスを追加
});

// プレビューマーカー用のアイコン（半透明）
const previewPokefutaIcon = L.icon({
  iconUrl: '/monsterball.png',
  iconSize: [36, 36], // 中間サイズ
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: 'preview-marker', // CSSクラスを追加
});

interface PhotoMarkerProps {
  photo: Photo;
  onClick?: (photo: Photo) => void;
  isNew?: boolean; // 新しいマーカーかどうか
  isPreview?: boolean; // プレビューマーカーかどうか
}

const PhotoMarker: React.FC<PhotoMarkerProps> = ({ photo, onClick, isNew = false, isPreview = false }) => {
  const handleClick = () => {
    if (onClick && !isPreview) { // プレビューマーカーはクリック無効
      onClick(photo);
    }
  };

  const getIcon = () => {
    if (isPreview) return previewPokefutaIcon;
    if (isNew) return newPokefutaIcon;
    return pokefutaIcon;
  };

  return (
    <Marker
      position={[photo.latitude, photo.longitude]}
      icon={getIcon()}
      eventHandlers={{
        click: handleClick,
      }}
    />
  );
};

export default PhotoMarker;