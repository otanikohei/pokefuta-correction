import React, { useEffect, useState } from 'react';
import { getRandomTopImage } from '../../utils/randomImage';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [randomImage, setRandomImage] = useState<string>('');

  // コンポーネント初期化時にランダム画像を選択
  useEffect(() => {
    const selectedImage = getRandomTopImage();
    setRandomImage(selectedImage);
    console.log('スプラッシュスクリーン用ランダム画像:', selectedImage);
  }, []);

  useEffect(() => {
    // 2秒後にフェードアウト開始
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // フェードアウト完了後にスプラッシュを非表示
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2500); // フェードアウト時間を含めて2.5秒

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`splash-screen ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-image">
          {randomImage && (
            <img 
              src={randomImage} 
              alt="ポケふたコレクション" 
              className="splash-logo"
            />
          )}
        </div>
        <h1 className="splash-title">マイ・ポケふたコレクション</h1>
        <p className="splash-subtitle">日本全国のポケモンマンホールを収集・管理</p>
      </div>
    </div>
  );
};

export default SplashScreen;