import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { PhotoUploadData } from '../types/photo';
import { savePhotoLocally } from '../utils/localStorageUpload';

const client = generateClient<Schema>();

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (uploadPhotoData: PhotoUploadData) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // まずS3アップロードを試行
      try {
        // ファイル名を生成（年/月/UUID形式）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const fileExtension = uploadPhotoData.file.name.split('.').pop();
        const uniqueId = crypto.randomUUID();
        const s3Key = `photos/${year}/${month}/${uniqueId}.${fileExtension}`;

        console.log('S3アップロード開始:', { s3Key, fileSize: uploadPhotoData.file.size });

        // S3にファイルをアップロード
        const uploadResult = await uploadData({
          key: s3Key,
          data: uploadPhotoData.file,
          options: {
            onProgress: ({ transferredBytes, totalBytes }: { transferredBytes?: number; totalBytes?: number }) => {
              if (totalBytes && transferredBytes) {
                const percentage = Math.round((transferredBytes / totalBytes) * 100);
                setProgress(percentage);
              }
            },
          },
        }).result;

        // DynamoDBにメタデータを保存
        const photoRecord = await client.models.Photo.create({
          filename: uploadPhotoData.file.name,
          s3Key: s3Key,
          latitude: uploadPhotoData.latitude,
          longitude: uploadPhotoData.longitude,
          capturedAt: uploadPhotoData.capturedAt,
          uploadedAt: new Date().toISOString(),
        });

        if (photoRecord.errors) {
          throw new Error(photoRecord.errors.map(e => e.message).join(', '));
        }

        console.log('S3アップロード完了:', {
          s3Key: uploadResult.key,
          photoId: photoRecord.data?.id,
        });

        return photoRecord.data;

      } catch (s3Error) {
        console.warn('S3アップロードに失敗、ローカルストレージにフォールバック:', s3Error);
        
        // S3アップロードが失敗した場合、ローカルストレージに保存
        setProgress(50);
        
        const localPhoto = await savePhotoLocally(
          uploadPhotoData.file,
          uploadPhotoData.latitude,
          uploadPhotoData.longitude,
          uploadPhotoData.capturedAt
        );
        
        setProgress(100);
        
        console.log('ローカルストレージに保存完了:', localPhoto.id);
        
        // ローカルデータをS3形式に変換して返す
        return {
          id: localPhoto.id,
          filename: localPhoto.filename,
          s3Key: `local://${localPhoto.id}`, // ローカル保存の識別子
          latitude: localPhoto.latitude,
          longitude: localPhoto.longitude,
          capturedAt: localPhoto.capturedAt,
          uploadedAt: localPhoto.uploadedAt,
        };
      }
    } catch (err) {
      console.error('アップロードエラー:', err);
      const errorMessage = err instanceof Error ? err.message : 'アップロードに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadPhoto,
    uploading,
    progress,
    error,
  };
};