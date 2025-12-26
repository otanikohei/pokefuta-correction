// 写真データ型
export interface Photo {
  id: string;
  filename: string;
  s3Key: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  uploadedAt: string;
  thumbnailUrl?: string;
}

// アップロード用データ型
export interface PhotoUploadData {
  file: File;
  latitude: number;
  longitude: number;
  capturedAt: string;
}

// EXIF データ型
export interface ExifData {
  latitude?: number;
  longitude?: number;
  dateTime?: string;
}