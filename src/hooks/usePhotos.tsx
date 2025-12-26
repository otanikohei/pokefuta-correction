import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { Photo } from '../types/photo';
import { getLocalPhotos } from '../utils/localStorageUpload';

const client = generateClient<Schema>();

export const usePhotos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      let allPhotos: Photo[] = [];

      // S3/DynamoDBから写真を取得を試行
      try {
        const { data, errors } = await client.models.Photo.list();
        
        if (errors) {
          console.warn('DynamoDB取得エラー:', errors);
        } else {
          // GraphQLレスポンスをPhoto型に変換
          const s3Photos: Photo[] = data.map(item => ({
            id: item.id,
            filename: item.filename,
            s3Key: item.s3Key,
            latitude: item.latitude,
            longitude: item.longitude,
            capturedAt: item.capturedAt,
            uploadedAt: item.uploadedAt,
            thumbnailUrl: item.thumbnailUrl || undefined,
          }));
          
          allPhotos = [...allPhotos, ...s3Photos];
        }
      } catch (s3Error) {
        console.warn('S3写真取得に失敗、ローカルストレージから取得:', s3Error);
      }

      // ローカルストレージから写真を取得
      const localPhotos = getLocalPhotos();
      const localPhotosMapped: Photo[] = localPhotos.map(local => ({
        id: local.id,
        filename: local.filename,
        s3Key: `local://${local.id}`,
        latitude: local.latitude,
        longitude: local.longitude,
        capturedAt: local.capturedAt,
        uploadedAt: local.uploadedAt,
        thumbnailUrl: local.dataUrl, // Base64データをサムネイルとして使用
      }));

      allPhotos = [...allPhotos, ...localPhotosMapped];
      
      console.log('写真取得完了:', { 
        total: allPhotos.length, 
        s3: allPhotos.filter(p => !p.s3Key.startsWith('local://')).length,
        local: localPhotosMapped.length 
      });

      setPhotos(allPhotos);
    } catch (err) {
      console.error('写真の取得エラー:', err);
      setError(err instanceof Error ? err.message : '写真の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createPhoto = async (photoData: Omit<Photo, 'id' | 'uploadedAt'>) => {
    try {
      const { data, errors } = await client.models.Photo.create({
        ...photoData,
        uploadedAt: new Date().toISOString(),
      });

      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      // 新しい写真を追加後、リストを更新
      await fetchPhotos();
      return data;
    } catch (err) {
      console.error('写真の作成エラー:', err);
      throw err;
    }
  };

  // 初回ロード時に写真を取得
  useEffect(() => {
    fetchPhotos();
  }, []);

  return {
    photos,
    loading,
    error,
    refetch: fetchPhotos,
    createPhoto,
  };
};