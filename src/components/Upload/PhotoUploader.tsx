import React, { useState, useRef } from 'react';
import { useUpload } from '../../hooks/useUpload';
import { usePhotos } from '../../hooks/usePhotos';
import { readExifData } from '../../utils/exifReader';
import { processImage, formatFileSize, isSupportedImageFormat } from '../../utils/imageProcessor';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import UploadProgress from './UploadProgress';
import LocationPicker from './LocationPicker';

interface PhotoUploaderProps {
  onPhotoUploaded?: (location: { lat: number; lng: number }, photoId?: string) => void;
  onPreviewLocationUpdate?: (location: { lat: number; lng: number } | null) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoUploaded, onPreviewLocationUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exifError, setExifError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [manualLocation, setManualLocation] = useState<{lat: number, lng: number} | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<string | null>(null);
  
  const { uploadPhoto, uploading, progress, error: uploadError } = useUpload();
  const { refetch } = usePhotos();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル形式チェック
    if (!isSupportedImageFormat(file)) {
      setExifError('サポートされていない画像形式です。JPEG、PNG、WEBP、HEICファイルを選択してください。');
      return;
    }

    setSelectedFile(file);
    setProcessedFile(null);
    setExifError(null);
    setShowLocationPicker(false);
    setManualLocation(null);
    setProcessingInfo(null);

    // プレビュー画像を作成
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // まず元ファイルからGPS情報を取得（画像処理前）
    setProcessing(true);
    try {
      console.log('元ファイルからGPS情報を取得中:', file.name);
      const originalExifData = await readExifData(file);
      
      if (originalExifData.latitude && originalExifData.longitude) {
        console.log('GPS情報の自動取得成功:', originalExifData);
        setManualLocation({
          lat: originalExifData.latitude,
          lng: originalExifData.longitude
        });
        
        // プレビュー位置を即座に更新
        if (onPreviewLocationUpdate) {
          onPreviewLocationUpdate({
            lat: originalExifData.latitude,
            lng: originalExifData.longitude
          });
        }
        
        // GPS情報が取得できた場合は、即座にマップフォーカスを更新
        if (onPhotoUploaded) {
          console.log('PhotoUploader: GPS取得成功、即座にマップフォーカス更新');
          onPhotoUploaded({ 
            lat: originalExifData.latitude, 
            lng: originalExifData.longitude 
          });
        }
      }

      // 画像処理を開始
      console.log('画像処理開始:', file.name);
      const processed = await processImage(file, 720, 0.85);
      setProcessedFile(processed.file);
      
      const compressionRatio = ((file.size - processed.file.size) / file.size * 100).toFixed(1);
      setProcessingInfo(
        `画像を処理しました: ${processed.originalWidth}×${processed.originalHeight} → ${processed.processedWidth}×${processed.processedHeight} ` +
        `(${formatFileSize(file.size)} → ${formatFileSize(processed.file.size)}, ${compressionRatio}% 削減)`
      );

      // GPS情報が取得できなかった場合の案内
      if (!originalExifData.latitude || !originalExifData.longitude) {
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
          setExifError(
            '📍 位置情報の手動指定が必要です\n\n' +
            'HEIC形式の画像から位置情報を読み取れませんでした。\n' +
            '下記のボタンから撮影場所を手動で指定してください。'
          );
        } else {
          setExifError(
            '📍 位置情報の手動指定が必要です\n\n' +
            'この画像にはGPS情報が含まれていないか、読み取りできませんでした。\n' +
            '下記のボタンから撮影場所を手動で指定してください。'
          );
        }
      }
    } catch (err) {
      console.error('ファイル処理エラー:', err);
      setExifError('ファイルの処理に失敗しました。別の画像を選択してください。');
    } finally {
      setProcessing(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setManualLocation({ lat, lng });
    setShowLocationPicker(false);
    setExifError(null);
    console.log('手動で選択された位置:', { lat, lng });
    
    // プレビュー位置を更新
    if (onPreviewLocationUpdate) {
      onPreviewLocationUpdate({ lat, lng });
    }
  };

  const handleUpload = async () => {
    const fileToUpload = processedFile || selectedFile;
    if (!fileToUpload) return;

    try {
      setExifError(null);
      
      let latitude: number;
      let longitude: number;
      let capturedAt: string;

      if (manualLocation) {
        // 手動で指定された位置を使用
        latitude = manualLocation.lat;
        longitude = manualLocation.lng;
        
        // 元ファイルから撮影日時を取得を試行
        try {
          const originalExifData = await readExifData(selectedFile!);
          capturedAt = originalExifData.dateTime || new Date().toISOString();
        } catch {
          capturedAt = new Date().toISOString(); // 取得失敗時は現在時刻
        }
      } else {
        // 元ファイルからEXIFデータを再読み取り
        const exifData = await readExifData(selectedFile!);
        
        if (!exifData.latitude || !exifData.longitude) {
          setExifError('GPS情報が含まれていません。位置を手動で指定してください。');
          return;
        }

        latitude = exifData.latitude;
        longitude = exifData.longitude;
        capturedAt = exifData.dateTime || new Date().toISOString();
      }

      // アップロード実行（処理済みファイルを使用）
      const uploadResult = await uploadPhoto({
        file: fileToUpload,
        latitude,
        longitude,
        capturedAt,
      });

      console.log('PhotoUploader: アップロード成功、コールバック呼び出し:', { 
        lat: latitude, 
        lng: longitude,
        photoId: uploadResult?.id 
      });

      // アップロード成功後、マップの中心を更新
      if (onPhotoUploaded) {
        onPhotoUploaded({ lat: latitude, lng: longitude }, uploadResult?.id);
      }

      // アップロード成功後、フォームをリセット
      setSelectedFile(null);
      setProcessedFile(null);
      setPreviewUrl(null);
      setManualLocation(null);
      setProcessingInfo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 写真リストを更新
      await refetch();
      
    } catch (err) {
      console.error('アップロードエラー:', err);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setProcessedFile(null);
    setPreviewUrl(null);
    setExifError(null);
    setManualLocation(null);
    setShowLocationPicker(false);
    setProcessingInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // プレビュー位置をクリア
    if (onPreviewLocationUpdate) {
      onPreviewLocationUpdate(null);
    }
  };

  const canUpload = (processedFile || selectedFile) && !processing && (manualLocation || (!exifError));

  return (
    <div className="photo-uploader">
      <h2>ポケふた写真をアップロード</h2>
      
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          disabled={uploading || processing}
          className="file-input"
        />
        
        {!selectedFile && (
          <div className="upload-prompt">
            <p>GPS情報付きの写真を選択してください</p>
            <small>JPEG、PNG、WEBP、HEIC形式に対応しています</small>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="selected-file">
          <h3>選択された写真</h3>
          <div className="file-info">
            <p><strong>ファイル名:</strong> {selectedFile.name}</p>
            <p><strong>元サイズ:</strong> {formatFileSize(selectedFile.size)}</p>
            <p><strong>形式:</strong> {selectedFile.type}</p>
            {processedFile && (
              <p><strong>処理後サイズ:</strong> {formatFileSize(processedFile.size)}</p>
            )}
          </div>

          {processing && (
            <div className="processing-status">
              <LoadingSpinner />
              <p>画像を処理中...</p>
            </div>
          )}

          {processingInfo && (
            <div className="processing-info">
              <p>{processingInfo}</p>
            </div>
          )}
          
          {previewUrl && (
            <div className="preview">
              <img 
                src={previewUrl} 
                alt="プレビュー" 
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          
          {exifError && (
            <div>
              <ErrorMessage message={exifError} />
              <button 
                onClick={() => setShowLocationPicker(true)}
                className="location-picker-button"
                disabled={uploading || processing}
              >
                マップで位置を指定する
              </button>
            </div>
          )}

          {manualLocation && (
            <div className="manual-location">
              <p><strong>指定された位置:</strong> {manualLocation.lat.toFixed(6)}, {manualLocation.lng.toFixed(6)}</p>
              <button 
                onClick={() => setShowLocationPicker(true)}
                className="location-picker-button"
                disabled={uploading || processing}
              >
                位置を変更する
              </button>
            </div>
          )}
          
          <div className="upload-actions">
            <button 
              onClick={handleUpload} 
              disabled={uploading || processing || !canUpload}
              className="upload-button"
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
            <button 
              onClick={handleCancel} 
              disabled={uploading || processing}
              className="cancel-button"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="upload-status">
          <LoadingSpinner />
          <UploadProgress progress={progress} />
        </div>
      )}

      {uploadError && <ErrorMessage message={uploadError} />}

      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
};

export default PhotoUploader;