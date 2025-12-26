import type { Photo } from '../types/photo';

// 日本の地理的境界
export const JAPAN_BOUNDS = {
  north: 45.557,
  south: 24.045,
  east: 145.817,
  west: 122.934,
};

// 日本の中心座標
export const JAPAN_CENTER = {
  latitude: 36.2048,
  longitude: 138.2529,
};

// 初期ズームレベル
export const DEFAULT_ZOOM = 6;

// 写真の位置から地図の境界を計算
export const calculateBounds = (photos: Photo[]) => {
  if (photos.length === 0) {
    return {
      north: JAPAN_BOUNDS.north,
      south: JAPAN_BOUNDS.south,
      east: JAPAN_BOUNDS.east,
      west: JAPAN_BOUNDS.west,
    };
  }

  const latitudes = photos.map(photo => photo.latitude);
  const longitudes = photos.map(photo => photo.longitude);

  return {
    north: Math.max(...latitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    west: Math.min(...longitudes),
  };
};

// 2点間の距離を計算（ハーバーサイン公式）
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};