// 画像処理ユーティリティ

export interface ProcessedImageResult {
  file: File;
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
}

/**
 * 画像を指定幅にリサイズしてJPEG形式に変換
 * @param file 元の画像ファイル
 * @param maxWidth 最大幅（デフォルト: 720px）
 * @param quality JPEG品質（0-1、デフォルト: 0.85）
 * @returns 処理済み画像とメタデータ
 */
export const processImage = async (
  file: File,
  maxWidth: number = 720,
  quality: number = 0.85
): Promise<ProcessedImageResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // 画像読み込み完了時の処理
    const handleLoad = () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // アスペクト比を維持してリサイズ計算
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (originalWidth > maxWidth) {
          const aspectRatio = originalHeight / originalWidth;
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth * aspectRatio);
        }

        // キャンバスサイズを設定
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 高品質リサイズのための設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 画像を描画
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // JPEG形式でBlob生成
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // 新しいファイル名を生成（拡張子をjpgに変更）
            const originalName = file.name;
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            const newFileName = `${nameWithoutExt}_processed.jpg`;

            // 新しいFileオブジェクトを作成
            const processedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve({
              file: processedFile,
              originalWidth,
              originalHeight,
              processedWidth: newWidth,
              processedHeight: newHeight,
            });
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    // エラー処理
    const handleError = () => {
      reject(new Error('Failed to load image'));
    };

    // イベントリスナーを設定
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // 画像を読み込み
    const url = URL.createObjectURL(file);
    img.src = url;

    // クリーンアップ関数
    const cleanup = () => {
      URL.revokeObjectURL(url);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };

    // 成功・失敗どちらの場合もクリーンアップを実行
    const originalResolve = resolve;
    const originalReject = reject;
    
    resolve = (value) => {
      cleanup();
      originalResolve(value);
    };
    
    reject = (reason) => {
      cleanup();
      originalReject(reason);
    };
  });
};

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 画像ファイルかどうかを判定
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * サポートされている画像形式かどうかを判定
 */
export const isSupportedImageFormat = (file: File): boolean => {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  
  return supportedTypes.includes(file.type.toLowerCase()) || 
         file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif)$/);
};