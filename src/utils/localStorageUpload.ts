// 一時的なローカルストレージアップロード機能
// S3の権限問題が解決するまでの代替手段

export interface LocalPhotoData {
  id: string;
  filename: string;
  dataUrl: string; // Base64エンコードされた画像データ
  latitude: number;
  longitude: number;
  capturedAt: string;
  uploadedAt: string;
}

const STORAGE_KEY = 'pokefuta_photos';

// ファイルをBase64に変換
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ローカルストレージに写真を保存
export const savePhotoLocally = async (
  file: File,
  latitude: number,
  longitude: number,
  capturedAt: string
): Promise<LocalPhotoData> => {
  try {
    const dataUrl = await fileToBase64(file);
    const photoData: LocalPhotoData = {
      id: crypto.randomUUID(),
      filename: file.name,
      dataUrl,
      latitude,
      longitude,
      capturedAt,
      uploadedAt: new Date().toISOString(),
    };

    // 既存の写真データを取得
    const existingPhotos = getLocalPhotos();
    
    // 新しい写真を追加
    const updatedPhotos = [...existingPhotos, photoData];
    
    // ローカルストレージに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    
    console.log('写真をローカルストレージに保存しました:', photoData.id);
    return photoData;
  } catch (error) {
    console.error('ローカルストレージへの保存エラー:', error);
    throw error;
  }
};

// ローカルストレージから写真一覧を取得
export const getLocalPhotos = (): LocalPhotoData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('ローカルストレージからの読み取りエラー:', error);
    return [];
  }
};

// ローカルストレージから写真を削除
export const deleteLocalPhoto = (id: string): void => {
  try {
    const existingPhotos = getLocalPhotos();
    const updatedPhotos = existingPhotos.filter(photo => photo.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    console.log('写真をローカルストレージから削除しました:', id);
  } catch (error) {
    console.error('ローカルストレージからの削除エラー:', error);
    throw error;
  }
};

// ローカルストレージをクリア
export const clearLocalPhotos = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('ローカルストレージをクリアしました');
};