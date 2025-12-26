// ランダム画像選択ユーティリティ

const TOP_IMAGES = [
  '/topimage01.jpg',
  '/topimage02.jpg',
  '/topimage03.jpg',
  '/topimage04.jpg',
];

/**
 * ランダムなトップ画像のパスを取得
 * @returns ランダムに選択された画像パス
 */
export const getRandomTopImage = (): string => {
  const randomIndex = Math.floor(Math.random() * TOP_IMAGES.length);
  return TOP_IMAGES[randomIndex];
};

/**
 * セッション固定のランダム画像を取得
 * ページリロード時に同じ画像を表示したい場合に使用
 * @returns セッション中固定のランダム画像パス
 */
export const getSessionRandomTopImage = (): string => {
  const sessionKey = 'pokefuta_session_image';
  const versionKey = 'pokefuta_image_version';
  const currentVersion = 'jpg_v1'; // バージョン管理用
  
  // セッションストレージから既存の画像とバージョンを取得
  let sessionImage = sessionStorage.getItem(sessionKey);
  const storedVersion = sessionStorage.getItem(versionKey);
  
  // バージョンが異なる場合は古いデータをクリア
  if (storedVersion !== currentVersion) {
    sessionStorage.removeItem(sessionKey);
    sessionImage = null;
  }
  
  if (!sessionImage) {
    // セッション中初回の場合、ランダムに選択して保存
    sessionImage = getRandomTopImage();
    sessionStorage.setItem(sessionKey, sessionImage);
    sessionStorage.setItem(versionKey, currentVersion);
    console.log('新しいセッション画像を設定:', sessionImage);
  } else {
    console.log('既存のセッション画像を使用:', sessionImage);
  }
  
  return sessionImage;
};

/**
 * 新しいランダム画像を強制的に選択
 * セッションストレージもクリアして完全に新しい画像を選択
 * @returns 新しいランダム画像パス
 */
export const getNewRandomTopImage = (): string => {
  const sessionKey = 'pokefuta_session_image';
  sessionStorage.removeItem(sessionKey);
  return getSessionRandomTopImage();
};