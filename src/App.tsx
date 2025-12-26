import { useState, useEffect } from 'react';
import './amplifyConfig'; // Amplify設定を初期化
import MapContainer from './components/Map/MapContainer';
import PhotoUploader from './components/Upload/PhotoUploader';
import SplashScreen from './components/UI/SplashScreen';
import { getSessionRandomTopImage } from './utils/randomImage';
import './App.css';

function App() {
  const [mapFocusLocation, setMapFocusLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // マップ更新用のキー
  const [headerImage, setHeaderImage] = useState<string>('');
  const [newPhotoId, setNewPhotoId] = useState<string | null>(null); // 新しい写真のID
  const [previewLocation, setPreviewLocation] = useState<{ lat: number; lng: number } | null>(null); // プレビュー位置

  // 写真アップロード成功時にマップの中心を更新
  const handlePhotoUploaded = (location: { lat: number; lng: number }, photoId?: string) => {
    console.log('App.tsx: 写真アップロード成功、マップフォーカスを設定:', location);
    setMapFocusLocation({
      lat: location.lat,
      lng: location.lng,
      zoom: 15 // 詳細レベルでズーム
    });
    
    // 新しい写真IDを設定（ハイライト用）
    if (photoId) {
      setNewPhotoId(photoId);
      console.log('App.tsx: 新しい写真IDを設定:', photoId);
      
      // 10秒後にハイライトをクリア
      setTimeout(() => {
        setNewPhotoId(null);
        console.log('App.tsx: 新しい写真IDをクリア');
      }, 10000);
    }
    
    // プレビューマーカーをクリア
    setPreviewLocation(null);
    
    // マップを強制的に更新（新しいマーカーを表示）
    setRefreshKey(prev => prev + 1);
    
    // 3秒後に自動的にフォーカスをクリア（オプション）
    setTimeout(() => {
      console.log('App.tsx: マップフォーカスをクリア');
      setMapFocusLocation(null);
    }, 3000);
  };

  // プレビュー位置を更新するハンドラー
  const handlePreviewLocationUpdate = (location: { lat: number; lng: number } | null) => {
    console.log('App.tsx: プレビュー位置を更新:', location);
    setPreviewLocation(location);
    
    // プレビュー位置が設定された場合、マップフォーカスも更新
    if (location) {
      setMapFocusLocation({
        lat: location.lat,
        lng: location.lng,
        zoom: 15
      });
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    
    // スプラッシュ完了後にヘッダー画像を初期化
    if (!headerImage) {
      const selectedImage = getSessionRandomTopImage();
      setHeaderImage(selectedImage);
      console.log('スプラッシュ完了後のヘッダー用ランダム画像:', selectedImage);
    }
  };

  // アプリ初期化時にヘッダー画像を設定
  useEffect(() => {
    // 開発中のため、一度セッションをクリアして確実に新しいJPGファイルを使用
    sessionStorage.removeItem('pokefuta_session_image');
    sessionStorage.removeItem('pokefuta_image_version');
    
    const selectedImage = getSessionRandomTopImage();
    setHeaderImage(selectedImage);
    console.log('アプリ初期化時のヘッダー用ランダム画像:', selectedImage);
  }, []);

  // スプラッシュスクリーン表示中
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // メインアプリケーション
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-image">
            {headerImage ? (
              <img 
                src={headerImage} 
                alt="ポケふタコレクション" 
                className="top-image"
                onLoad={() => console.log('ヘッダー画像読み込み成功:', headerImage)}
                onError={() => console.error('ヘッダー画像読み込み失敗:', headerImage)}
              />
            ) : (
              <div className="image-placeholder">画像読み込み中...</div>
            )}
          </div>
          <div className="header-text">
            <h1>マイ・ポケふたコレクション</h1>
            <p>日本全国のポケモンマンホールを収集・管理</p>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="upload-section">
          <PhotoUploader 
            onPhotoUploaded={handlePhotoUploaded}
            onPreviewLocationUpdate={handlePreviewLocationUpdate}
          />
        </div>
        
        <div className="map-section">
          <MapContainer 
            key={refreshKey} 
            focusLocation={mapFocusLocation}
            newPhotoId={newPhotoId}
            previewLocation={previewLocation}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
