import exifr from 'exifr';
import type { ExifData } from '../types/photo';

// EXIF データ読み取り関数
export const readExifData = async (file: File): Promise<ExifData> => {
  console.log('EXIF読み取り開始:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  });

  try {
    // exifrを使用してEXIFデータを読み取り
    console.log('exifrでEXIF読み取りを試行...');
    
    // HEICファイルを含む全ての画像形式に対応
    const exifData = await exifr.parse(file, {
      gps: true,
      exif: true,
      ifd0: true,
      ifd1: true,
      interop: true,
      makerNote: false, // メーカー固有データは不要
      userComment: false, // ユーザーコメントは不要
      sanitize: true, // データをサニタイズ
      mergeOutput: true, // 出力をマージ
      silentErrors: false, // エラーを表示
    });

    console.log('exifrで取得したEXIFデータ:', exifData);

    if (!exifData) {
      console.log('EXIFデータが見つかりませんでした');
      return {
        latitude: undefined,
        longitude: undefined,
        dateTime: undefined,
      };
    }

    // GPS情報を取得
    let latitude: number | undefined;
    let longitude: number | undefined;

    // exifrは自動的にGPS座標を十進度に変換してくれる
    if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
      latitude = exifData.latitude;
      longitude = exifData.longitude;
      console.log('GPS座標を取得:', { latitude, longitude });
    } else {
      console.log('GPS情報が見つかりません');
    }

    // 撮影日時を取得
    let dateTime: string | undefined;
    if (exifData.DateTimeOriginal) {
      dateTime = new Date(exifData.DateTimeOriginal).toISOString();
      console.log('撮影日時を取得:', dateTime);
    } else if (exifData.DateTime) {
      dateTime = new Date(exifData.DateTime).toISOString();
      console.log('日時を取得:', dateTime);
    } else {
      console.log('撮影日時が見つかりません');
    }

    const result = {
      latitude,
      longitude,
      dateTime,
    };

    console.log('最終的なEXIF読み取り結果:', result);
    return result;

  } catch (error) {
    console.error('exifrでのEXIF読み取りエラー:', error);
    
    // エラーが発生した場合は空の結果を返す
    return {
      latitude: undefined,
      longitude: undefined,
      dateTime: undefined,
    };
  }
};

// GPS座標をDMS（度分秒）からDD（十進度）に変換
export const convertDMSToDD = (
  degrees: number,
  minutes: number,
  seconds: number,
  direction: string
): number => {
  console.log('DMS→DD変換:', { degrees, minutes, seconds, direction });
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  console.log('変換結果:', dd);
  return dd;
};

// 座標の精度を指定桁数に丸める
export const roundCoordinate = (coordinate: number, precision: number = 6): number => {
  return Math.round(coordinate * Math.pow(10, precision)) / Math.pow(10, precision);
};