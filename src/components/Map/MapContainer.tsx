import React, { useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { usePhotos } from '../../hooks/usePhotos';
import PhotoMarker from './PhotoMarker';
import PhotoPopup from './PhotoPopup';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import type { Photo } from '../../types/photo';

// マップの中心位置を更新するコンポーネント
const MapCenterUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

interface MapContainerProps {
  focusLocation?: { lat: number; lng: number; zoom?: number } | null;
  newPhotoId?: string | null; // 新しくアップロードされた写真のID
  previewLocation?: { lat: number; lng: number } | null; // プレビュー位置
}

const MapContainer: React.FC<MapContainerProps> = ({ focusLocation, newPhotoId, previewLocation }) => {
  const { photos, loading, error, refetch } = usePhotos();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6762, 139.6503]);
  const [mapZoom, setMapZoom] = useState(6);
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null);

  // 新しい写真IDが設定された時のハイライト処理
  useEffect(() => {
    if (newPhotoId) {
      setHighlightedPhotoId(newPhotoId);
      console.log('新しい写真をハイライト:', newPhotoId);
      
      // 5秒後にハイライトを解除
      const timer = setTimeout(() => {
        setHighlightedPhotoId(null);
        console.log('ハイライトを解除:', newPhotoId);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [newPhotoId]);

  // 日本の中心座標（東京周辺）
  const japanCenter: [number, number] = [35.6762, 139.6503];
  const defaultZoom = 6;

  // focusLocationが変更された時にマップの中心を更新
  useEffect(() => {
    console.log('MapContainer: focusLocationが変更されました:', focusLocation);
    if (focusLocation) {
      const newCenter: [number, number] = [focusLocation.lat, focusLocation.lng];
      const newZoom = focusLocation.zoom || 15; // デフォルトで詳細レベルにズーム
      
      // 現在の位置と異なる場合のみ更新
      const currentLat = mapCenter[0];
      const currentLng = mapCenter[1];
      const latDiff = Math.abs(currentLat - newCenter[0]);
      const lngDiff = Math.abs(currentLng - newCenter[1]);
      const zoomDiff = Math.abs(mapZoom - newZoom);
      
      // 微小な差は無視（無限ループ防止）
      if (latDiff > 0.000001 || lngDiff > 0.000001 || zoomDiff > 0) {
        console.log('MapContainer: マップの中心を更新:', { 
          from: mapCenter, 
          to: newCenter, 
          fromZoom: mapZoom, 
          toZoom: newZoom 
        });
        
        setMapCenter(newCenter);
        setMapZoom(newZoom);
      }
    }
  }, [focusLocation]); // mapCenter, mapZoomを依存配列から削除

  const handleMarkerClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handlePopupClose = () => {
    setSelectedPhoto(null);
  };

  // 日本全体表示に戻すボタンのハンドラー
  const handleResetView = () => {
    setMapCenter(japanCenter);
    setMapZoom(defaultZoom);
  };

  const handlePhotoDeleted = async () => {
    // 写真が削除された後、写真リストを更新
    console.log('写真が削除されました、リストを更新します');
    
    // 選択された写真のポップアップを閉じる
    setSelectedPhoto(null);
    
    // 写真リストを再取得してマップを更新
    try {
      await refetch();
      console.log('写真リストの更新が完了しました');
    } catch (err) {
      console.error('写真リスト更新エラー:', err);
    }
  };

  if (loading) {
    return (
      <div className="map-container">
        <LoadingSpinner />
        <p>写真データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>ポケふたマップ</h2>
        <div className="map-controls">
          <button 
            onClick={handleResetView}
            className="reset-view-button"
            title="日本全体を表示"
          >
            🗾 全体表示
          </button>
        </div>
      </div>
      
      <div className="map-info">
        <p>登録済み写真数: {photos.length}枚</p>
        {focusLocation && (
          <p className="focus-info">
            📍 位置: {focusLocation.lat.toFixed(6)}, {focusLocation.lng.toFixed(6)}
          </p>
        )}
      </div>
      
      <div className="map-wrapper" style={{ height: '500px', width: '100%' }}>
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
          
          {photos.map((photo) => (
            <PhotoMarker
              key={photo.id}
              photo={photo}
              onClick={() => handleMarkerClick(photo)}
              isNew={photo.id === highlightedPhotoId}
            />
          ))}
          
          {/* プレビューマーカーを表示 */}
          {previewLocation && (
            <PhotoMarker
              key="preview-marker"
              photo={{
                id: 'preview',
                filename: 'プレビュー',
                s3Key: 'preview',
                latitude: previewLocation.lat,
                longitude: previewLocation.lng,
                capturedAt: new Date().toISOString(),
                uploadedAt: new Date().toISOString(),
              }}
              isPreview={true}
            />
          )}
        </LeafletMap>
      </div>

      {selectedPhoto && (
        <PhotoPopup
          photo={selectedPhoto}
          onClose={handlePopupClose}
          onPhotoDeleted={handlePhotoDeleted}
        />
      )}
    </div>
  );
};

export default MapContainer;