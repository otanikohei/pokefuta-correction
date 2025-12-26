import { useState } from 'react';
import { remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { deleteLocalPhoto } from '../utils/localStorageUpload';

const client = generateClient<Schema>();

export const useDeletePhoto = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePhoto = async (photoId: string, s3Key: string) => {
    setDeleting(true);
    setError(null);

    try {
      // ローカルストレージの写真かどうかを確認
      if (s3Key.startsWith('local://')) {
        // ローカルストレージから削除
        const localId = s3Key.replace('local://', '');
        deleteLocalPhoto(localId);
        console.log('ローカル写真を削除しました:', localId);
      } else {
        // S3から写真を削除
        try {
          await remove({ key: s3Key });
          console.log('S3から写真を削除しました:', s3Key);
        } catch (s3Error) {
          console.warn('S3削除エラー（継続）:', s3Error);
          // S3削除が失敗してもDynamoDB削除は継続
        }

        // DynamoDBからメタデータを削除
        try {
          const deleteResult = await client.models.Photo.delete({ id: photoId });
          if (deleteResult.errors) {
            throw new Error(deleteResult.errors.map(e => e.message).join(', '));
          }
          console.log('DynamoDBから写真メタデータを削除しました:', photoId);
        } catch (dbError) {
          console.warn('DynamoDB削除エラー:', dbError);
          throw dbError;
        }
      }

      return true;
    } catch (err) {
      console.error('写真削除エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '写真の削除に失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  return {
    deletePhoto,
    deleting,
    error,
  };
};