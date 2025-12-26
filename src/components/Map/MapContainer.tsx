import React, { useState, useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { usePhotos } from '../../hooks/usePhotos';
import { useGeolocation } from '../../hooks/useGeolocation';
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
  const { latitude, longitude, error: gpsError, loading: gpsLoading, refetch: refetchGPS } = useGeolocation();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // 日本の中心座標（東京周辺）をデフォルトとして使用
  const japanCenter: [number, number] = [35.6762, 139.6503];
  const defaultZoom = 6;
  const gpsZoom = 12; // 10km程度の縮尺（5マイル相当）
  
  // GPS位置が取得できた場合はそれを使用、そうでなければ日本の中心を使用
  const initialCenter: [number, number] = 
    latitude !== null && longitude !== null 
      ? [latitude, longitude] 
      : japanCenter;
  
  const initialZoom = latitude !== null && longitude !== null ? gpsZoom : defaultZoom;
  
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null);
  const [mapHeight, setMapHeight] = useState('500px');

  // GPS位置情報が取得できた時にマップの中心を更新
  useEffect(() => {
    if (latitude !== null && longitude !== null && !focusLocation) {
      console.log('GPS位置情報を取得しました:', { latitude, longitude });
      const gpsCenter: [number, number] = [latitude, longitude];
      
      // 現在の位置と異なる場合のみ更新
      const currentLat = mapCenter[0];
      const currentLng = mapCenter[1];
      const latDiff = Math.abs(currentLat - gpsCenter[0]);
      const lngDiff = Math.abs(currentLng - gpsCenter[1]);
      
      // 微小な差は無視（無限ループ防止）
      if (latDiff > 0.000001 || lngDiff > 0.000001) {
        console.log('GPS位置でマップの中心を更新:', { 
          from: mapCenter, 
          to: gpsCenter, 
          zoom: gpsZoom 
        });
        
        setMapCenter(gpsCenter);
        setMapZoom(gpsZoom);
      }
    }
  }, [latitude, longitude, focusLocation]);

  // モバイルデバイスでのマップ高さ調整
  useEffect(() => {
    const updateMapHeight = () => {
      const isMobile = window.innerWidth <= 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      
      if (isMobile) {
        if (isLandscape) {
          setMapHeight('300px');
        } else {
          // ビューポートの高さから他の要素を引いた高さを計算
          const availableHeight = window.innerHeight - 300; // ヘッダーとアップロード部分を除く
          const minHeight = 350;
          const maxHeight = 600;
          const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
          setMapHeight(`${calculatedHeight}px`);
        }
      } else {
        setMapHeight('500px');
      }
    };

    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);
    window.addEventListener('orientationchange', updateMapHeight);

    return () => {
      window.removeEventListener('resize', updateMapHeight);
      window.removeEventListener('orientationchange', updateMapHeight);
    };
  }, []);

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
  // const japanCenter: [number, number] = [35.6762, 139.6503]; // 上で定義済み
  // const defaultZoom = 6; // 上で定義済み

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

  // 現在位置に戻すボタンのハンドラー
  const handleGoToCurrentLocation = () => {
    if (latitude !== null && longitude !== null) {
      const currentLocation: [number, number] = [latitude, longitude];
      setMapCenter(currentLocation);
      setMapZoom(gpsZoom);
    } else {
      // GPS情報を再取得
      refetchGPS();
    }
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
            onClick={handleGoToCurrentLocation}
            className="current-location-button"
            title={latitude !== null && longitude !== null ? "現在位置に移動" : "位置情報を取得"}
            disabled={gpsLoading}
          >
            {gpsLoading ? "📍⏳" : latitude !== null && longitude !== null ? "📍 現在位置" : "📍 位置取得"}
          </button>
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
        {gpsLoading && (
          <p className="gps-info">📍 位置情報を取得中...</p>
        )}
        {gpsError && (
          <p className="gps-error">⚠️ {gpsError}</p>
        )}
        {latitude !== null && longitude !== null && (
          <p className="gps-success">
            📍 現在位置: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        )}
        {focusLocation && (
          <p className="focus-info">
            📍 選択位置: {focusLocation.lat.toFixed(6)}, {focusLocation.lng.toFixed(6)}
          </p>
        )}
      </div>
      
      <div className="map-wrapper" style={{ height: mapHeight, width: '100%' }}>
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          touchZoom={true}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
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