/**
 * Geofencing & GPS Location Utilities for Smart HR
 * Uses Haversine Formula for high-accuracy Earth surface distance calculation
 */

import { CompanySettings, MobilePunchPayload, MobilePunchResult, AttendanceRecord, Shift } from '../types';

const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters

/**
 * Calculates accurate great-circle distance between two points in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Format distance into friendly Arabic string (e.g., "35 متراً" or "1.2 كم")
 */
export function formatDistanceArabic(meters: number): string {
  if (meters === Infinity || isNaN(meters)) return 'غير محدد';
  if (meters < 1000) {
    return `${Math.round(meters)} متر`;
  }
  const km = (meters / 1000).toFixed(2);
  return `${km} كم`;
}

/**
 * Modern wrapper for Browser Geolocation API with high accuracy
 */
export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
}

export function getCurrentUserLocation(
  timeoutMs = 12000
): Promise<{ success: boolean; location?: GpsLocationResult; error?: string; errorCode?: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      resolve({
        success: false,
        error: 'متصفحك أو جهازك لا يدعم خاصية تحديد الموقع الجغرافي (Geolocation API).',
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          },
        });
      },
      (err) => {
        let errorMsg = 'تعذر الحصول على الموقع الجغرافي الحالي.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'تم رفض إذن الوصول إلى الموقع الجغرافي. يرجى تفعيل إذن الموقع (GPS) في متصفحك أو إعدادات الهاتف للمتابعة.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'معلومات الموقع غير متاحة حالياً. تأكد من تشغيل الـ GPS وجودة إشارة الأقمار الصناعية أو اتصال الإنترنت.';
            break;
          case err.TIMEOUT:
            errorMsg = 'انتهت مهلة البحث عن إشارة الموقع (GPS Timeout). يرجى المحاولة في مكان مفتوح أو إعادة المحاولة.';
            break;
        }
        resolve({
          success: false,
          errorCode: err.code,
          error: errorMsg,
        });
      },
      options
    );
  });
}

/**
 * Validates a mobile punch request against company geofence configuration
 */
export function validateAndProcessPunch(
  payload: MobilePunchPayload,
  companySettings: CompanySettings,
  shifts: Shift[] = []
): MobilePunchResult {
  const companyLat = companySettings.companyLat ?? 30.0444;
  const companyLng = companySettings.companyLng ?? 31.2357;
  const allowedRadius = companySettings.allowedRadiusMeters ?? 50;
  const allowWithWarning = companySettings.allowOutsideGeofenceWithWarning ?? false;
  const isGeofenceEnabled = companySettings.enableGeofenceAttendance ?? true;

  const distance = calculateHaversineDistance(
    payload.userLat,
    payload.userLng,
    companyLat,
    companyLng
  );

  const inRange = !isGeofenceEnabled || distance <= allowedRadius;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hours}:${minutes}`;
  const timestamp = `${dateStr} ${timeStr}:${String(now.getSeconds()).padStart(2, '0')}`;

  if (!inRange && !allowWithWarning) {
    return {
      success: false,
      inRange: false,
      distanceMeters: distance,
      allowedRadiusMeters: allowedRadius,
      punchType: payload.punchType,
      timestamp,
      timeStr,
      dateStr,
      message: `عذراً، أنت خارج النطاق الجغرافي المسموح به لمقر الشركة! المسافة بينك وبين المقر: (${formatDistanceArabic(distance)})، والحد الأقصى المسموح به هو (${allowedRadius} متر).`,
    };
  }

  // Determine matched shift
  let matchedShiftName = 'الوردية الصباحية';
  if (shifts.length > 0) {
    let bestDiff = Infinity;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    for (const s of shifts) {
      const [sH, sM] = s.startTime.split(':').map(Number);
      const diff = Math.abs(sH * 60 + sM - currentMins);
      if (diff < bestDiff) {
        bestDiff = diff;
        matchedShiftName = s.name;
      }
    }
  }

  const successMessage =
    payload.punchType === 'check_in'
      ? inRange
        ? `تم تسجيل حضورك بنجاح داخل نطاق مقر الشركة (${formatDistanceArabic(distance)} من المقر)!`
        : `تم تسجيل حضورك مع تنبيه (خارج النطاق الجغرافي: ${formatDistanceArabic(distance)}).`
      : inRange
      ? `تم تسجيل انصرافك بنجاح داخل نطاق مقر الشركة (${formatDistanceArabic(distance)} من المقر)!`
      : `تم تسجيل انصرافك مع تنبيه (خارج النطاق الجغرافي: ${formatDistanceArabic(distance)}).`;

  return {
    success: true,
    inRange,
    distanceMeters: distance,
    allowedRadiusMeters: allowedRadius,
    punchType: payload.punchType,
    timestamp,
    timeStr,
    dateStr,
    message: successMessage,
  };
}
