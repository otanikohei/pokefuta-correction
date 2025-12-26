import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import type { Photo } from '../../types/photo';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import { useDeletePhoto } from '../../hooks/useDeletePhoto';

interface PhotoPopupProps {
  photo: Photo;
  onClose: () => void;
  onPhotoDeleted?: () => void; // 削除後のコールバック
}

const PhotoPopup: React.FC<PhotoPopupProps> = ({ photo, onClose, onPhotoDeleted }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { deletePhoto, deleting, error: deleteError } = useDeletePhoto();

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ローカルストレージの画像かどうかを確認
        if (photo.s3Key.startsWith('local://')) {
          // ローカルストレージの場合、thumbnailUrlをそのまま使用
          if (photo.thumbnailUrl) {
            setImageUrl(photo.thumbnailUrl);
          } else {
            setError('ローカル画像データが見つかりません');
          }
        } else {
          // S3から署名付きURLを取得
          const url = await getUrl({
            key: photo.s3Key,
            options: {
              expiresIn: 3600, // 1時間有効
            },
          });
          
          setImageUrl(url.url.toString());
        }
      } catch (err) {
        console.error('画像URL取得エラー:', err);
        setError('画像の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [photo.s3Key, photo.thumbnailUrl]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePhoto(photo.id, photo.s3Key);
      
      console.log('写真削除成功、コールバックを呼び出します');
      
      // 削除成功後、親コンポーネントに通知
      if (onPhotoDeleted) {
        onPhotoDeleted();
      }
      
      // ポップアップを閉じる
      onClose();
    } catch (err) {
      // エラーは useDeletePhoto で処理済み
      console.error('削除処理でエラーが発生しました:', err);
      // エラーが発生してもポップアップは開いたままにする
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !deleting) {
      onClose();
    }
  };

  return (
    <div className="photo-popup-backdrop" onClick={handleBackdropClick}>
      <div className="photo-popup">
        <div className="popup-header">
          <h3>ポケふた写真詳細</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="popup-content">
          {loading && (
            <div className="loading-container">
              <LoadingSpinner />
              <p>画像を読み込み中...</p>
            </div>
          )}
          
          {error && <ErrorMessage message={error} />}
          
          {imageUrl && !loading && (
            <div className="image-container">
              <img 
                src={imageUrl} 
                alt={photo.filename}
                className="popup-image"
              />
            </div>
          )}
          
          <div className="photo-details">
            <div className="detail-item">
              <strong>写真を撮った日:</strong> {formatDate(photo.capturedAt)}
            </div>
            <div className="detail-item">
              <strong>写真を送った日:</strong> {formatDate(photo.uploadedAt)}
            </div>
          </div>

          {deleteError && <ErrorMessage message={deleteError} />}

          <div className="photo-actions">
            <button 
              onClick={handleDeleteClick}
              disabled={deleting}
              className="delete-button"
            >
              {deleting ? '削除中...' : '写真を消す'}
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirm-overlay">
              <div className="delete-confirm-dialog">
                <h4>写真を削除しますか？</h4>
                <p>この操作は取り消せません。</p>
                <div className="delete-confirm-actions">
                  <button 
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="confirm-delete-button"
                  >
                    {deleting ? '削除中...' : '削除する'}
                  </button>
                  <button 
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="cancel-delete-button"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoPopup;