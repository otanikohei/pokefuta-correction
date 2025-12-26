import React, { useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// 位置選択用のマーカーアイコン
const locationIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#ff4444" stroke="#fff" stroke-width="2"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
      <path d="M12 14 L8 20 L16 20 Z" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

// マップクリックイベントを処理するコンポーネント
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, onClose }) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  // 日本の中心座標（東京周辺）
  const japanCenter: [number, number] = [35.6762, 139.6503];
  const defaultZoom = 10;

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
  };

  const handleConfirm = () => {
    if (selectedPosition) {
      onLocationSelect(selectedPosition[0], selectedPosition[1]);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="location-picker-backdrop" onClick={handleBackdropClick}>
      <div className="location-picker-modal">
        <div className="modal-header">
          <h3>撮影場所を選択してください</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <p className="instruction">
            マップをクリックして撮影場所を指定してください
          </p>
          
          <div className="map-container" style={{ height: '400px', width: '100%' }}>
            <LeafletMap
              center={japanCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapClickHandler onLocationSelect={handleMapClick} />
              
              {selectedPosition && (
                <Marker position={selectedPosition} icon={locationIcon} />
              )}
            </LeafletMap>
          </div>

          {selectedPosition && (
            <div className="selected-location-info">
              <p>
                <strong>選択された位置:</strong> 
                緯度 {selectedPosition[0].toFixed(6)}, 経度 {selectedPosition[1].toFixed(6)}
              </p>
            </div>
          )}
          
          <div className="modal-actions">
            <button 
              onClick={handleConfirm} 
              disabled={!selectedPosition}
              className="confirm-button"
            >
              この位置を使用する
            </button>
            <button onClick={onClose} className="cancel-button">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;