import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  Clock,
  ShieldCheck,
  Save,
  Check,
  Moon,
  Sun,
  Info,
  Upload,
  Trash2,
  MapPin,
  Navigation,
  Smartphone,
  ExternalLink,
  Copy,
  AlertTriangle,
  Radio,
  Sparkles
} from 'lucide-react';
import { CompanySettings } from '../types';
import { getCurrentUserLocation } from '../utils/geofence';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currencySymbol: string;
  setCurrencySymbol: (val: string) => void;
  companySettings?: CompanySettings;
  onUpdateCompanySettings?: (settings: CompanySettings) => void;
  onOpenMobilePortal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  setDarkMode,
  currencySymbol,
  setCurrencySymbol,
  companySettings,
  onUpdateCompanySettings,
  onOpenMobilePortal,
}) => {
  const [companyName, setCompanyName] = useState(companySettings?.companyName || 'شركة جديدة');
  const [taxNumber, setTaxNumber] = useState(companySettings?.taxNumber || '');
  const [crNumber, setCrNumber] = useState(companySettings?.commercialRecord || '');
  const [logoUrl, setLogoUrl] = useState(companySettings?.logoUrl || '');
  const [gosiRate, setGosiRate] = useState<number | string>(companySettings?.gosiEmployeePercent ?? 11);
  
  // Geofence & Location State
  const [companyLat, setCompanyLat] = useState<number | string>(companySettings?.companyLat ?? 30.0444);
  const [companyLng, setCompanyLng] = useState<number | string>(companySettings?.companyLng ?? 31.2357);
  const [allowedRadius, setAllowedRadius] = useState<number | string>(companySettings?.allowedRadiusMeters ?? 50);
  const [companyAddress, setCompanyAddress] = useState(companySettings?.companyAddress || 'المقر الرئيسي للشركة');
  const [enableGeofence, setEnableGeofence] = useState<boolean>(companySettings?.enableGeofenceAttendance ?? true);
  const [allowOutsideWarning, setAllowOutsideWarning] = useState<boolean>(companySettings?.allowOutsideGeofenceWithWarning ?? false);

  const [isLocatingHQ, setIsLocatingHQ] = useState(false);
  const [locateSuccess, setLocateSuccess] = useState<string | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (companySettings) {
      setCompanyName(companySettings.companyName || '');
      setTaxNumber(companySettings.taxNumber || '');
      setCrNumber(companySettings.commercialRecord || '');
      setLogoUrl(companySettings.logoUrl || '');
      setGosiRate(companySettings.gosiEmployeePercent ?? 11);
      setCompanyLat(companySettings.companyLat ?? 30.0444);
      setCompanyLng(companySettings.companyLng ?? 31.2357);
      setAllowedRadius(companySettings.allowedRadiusMeters ?? 50);
      setCompanyAddress(companySettings.companyAddress || 'المقر الرئيسي للشركة');
      setEnableGeofence(companySettings.enableGeofenceAttendance ?? true);
      setAllowOutsideWarning(companySettings.allowOutsideGeofenceWithWarning ?? false);
    }
  }, [companySettings]);

  const handleCaptureCurrentLocation = async () => {
    setIsLocatingHQ(true);
    setLocateError(null);
    setLocateSuccess(null);

    const res = await getCurrentUserLocation(15000);
    setIsLocatingHQ(false);

    if (res.success && res.location) {
      const lat = Math.round(res.location.latitude * 100000) / 100000;
      const lng = Math.round(res.location.longitude * 100000) / 100000;
      setCompanyLat(lat);
      setCompanyLng(lng);
      setLocateSuccess(`تم التقاط إحداثيات موقعك الحالي بنجاح (دقة: ±${res.location.accuracy} متر)!`);
      setTimeout(() => setLocateSuccess(null), 4000);
    } else {
      setLocateError(res.error || 'تعذر تحديد الموقع الجغرافي. يرجى تفعيل الـ GPS في المتصفح.');
      setTimeout(() => setLocateError(null), 6000);
    }
  };

  const handleCopyMobileLink = () => {
    const mobileUrl = `${window.location.origin}${window.location.pathname}#mobile`;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 3 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoUrl('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: CompanySettings = {
      companyName: companyName || 'شركة جديدة',
      taxNumber: taxNumber || '',
      commercialRecord: crNumber || '',
      overtimeRateMultiplier: companySettings?.overtimeRateMultiplier || 1.5,
      gosiEmployeePercent: typeof gosiRate === 'number' ? gosiRate : Number(gosiRate) || 11,
      enableSmartGuard: companySettings?.enableSmartGuard ?? true,
      currencySymbol: currencySymbol || 'ج.م',
      workDaysPerMonth: companySettings?.workDaysPerMonth || 30,
      logoUrl: logoUrl || undefined,
      companyLat: typeof companyLat === 'number' ? companyLat : Number(companyLat) || 30.0444,
      companyLng: typeof companyLng === 'number' ? companyLng : Number(companyLng) || 31.2357,
      allowedRadiusMeters: typeof allowedRadius === 'number' ? allowedRadius : Number(allowedRadius) || 50,
      companyAddress: companyAddress || 'المقر الرئيسي للشركة',
      enableGeofenceAttendance: enableGeofence,
      allowOutsideGeofenceWithWarning: allowOutsideWarning,
    };

    if (onUpdateCompanySettings) {
      onUpdateCompanySettings(updatedSettings);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>إعدادات النظام والسياسات العامة</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تهيئة بيانات المنشأة، عملة الحسابات، النطاق الجغرافي لحضور الموبايل (GPS)، والسياسات العامة.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 shadow-blue-500/20 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>تم حفظ الإعدادات بنجاح!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات والسياسات</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Company Legal Information */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              بيانات المنشأة والهوية الرسمية
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative group">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="شعار الشركة"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-1 opacity-50 text-blue-500" />
                    <span className="text-[9px] font-bold block">شعار الشركة</span>
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                  title="اختر صورة شعار المنشأة"
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-right flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <label className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? 'تغيير الشعار' : 'رفع شعار المنشأة'}</span>
                    <input
                      type="file"
                      onChange={handleLogoUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="حذف الشعار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  يظهر الشعار في أعلى الشهادات التدريبية المعتمدة ومسيرات الرواتب والتقارير الرسمية (PNG / JPG / SVG).
                </p>
              </div>
            </div>
            
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم المنشأة / الشركة</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="أدخل اسم المنشأة أو الشركة..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الرقم الضريبي (VAT Number)</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="أدخل الرقم الضريبي..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم السجل التجاري (CR)</label>
              <input
                type="text"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                placeholder="أدخل رقم السجل التجاري..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </div>

        {/* GPS Geofencing & Mobile Attendance Settings (NEW HR ADMIN MODULE) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                النطاق الجغرافي وحضور الموبايل (GPS Geofencing)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
              موبايل GPS
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">تفعيل الحضور الجغرافي عبر الموبايل</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">السماح للموظفين بتسجيل الحضور والانصراف من هواتفهم داخل نطاق المقر</span>
              </div>
              <button
                type="button"
                onClick={() => setEnableGeofence(!enableGeofence)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  enableGeofence ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    enableGeofence ? 'translate-x-0' : '-translate-x-5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم أو وصف المقر المعتمد</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="مثال: المقر الرئيسي - التجمع الخامس / مدينة نصر..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>

            {/* Coordinates Inputs with Auto Capture Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">إحداثيات المقر (Latitude / Longitude)</label>
                <button
                  type="button"
                  onClick={handleCaptureCurrentLocation}
                  disabled={isLocatingHQ}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  title="التقاط الإحداثيات الجغرافية لموقعك الحالي الآن"
                >
                  <Navigation className={`w-3 h-3 ${isLocatingHQ ? 'animate-spin' : ''}`} />
                  <span>{isLocatingHQ ? 'جاري الالتقاط...' : '📍 تحديد موقعي الحالي كمقر للشركة'}</span>
                </button>
              </div>

              {locateSuccess && (
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{locateSuccess}</span>
                </div>
              )}

              {locateError && (
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{locateError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">خط العرض (Latitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={companyLat}
                    onChange={(e) => setCompanyLat(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="30.0444"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">خط الطول (Longitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={companyLng}
                    onChange={(e) => setCompanyLng(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="31.2357"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Allowed Radius Settings & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                  نصف القطر المسموح به (Geofence Radius): <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold">{allowedRadius} متراً</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={Number(allowedRadius) || 50}
                  onChange={(e) => setAllowedRadius(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={allowedRadius}
                  onChange={(e) => setAllowedRadius(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-center text-xs"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-bold">خيارات سريعة:</span>
                {[30, 50, 100, 200, 500].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAllowedRadius(r)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                      Number(allowedRadius) === r
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {r}م
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions: Share Mobile Link & Launch Mobile Portal */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyMobileLink}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم نسخ رابط الموبايل!' : 'نسخ رابط صفحة الموبايل للموظفين'}</span>
              </button>

              {onOpenMobilePortal && (
                <button
                  type="button"
                  onClick={onOpenMobilePortal}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>فتح واجهة الموظف للمعاينة</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من رغبتك في فك ربط الموظف الحالي على هذا الجهاز؟ سيتيح ذلك اختيار وتثبيت موظف جديد لمرة واحدة عند الدخول برمز 1000.')) {
                    localStorage.removeItem('kiosk_locked_emp_id');
                    alert('تم فك القفل بنجاح.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-amber-300 dark:border-amber-800"
                title="إعادة تعيين الموظف المقفل على هذا الجهاز لوضع 1000"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>إعادة ضبط قفل الموظف (وضع 1000)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial & Currency Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              إعدادات العملات والخصومات والتأمينات
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رمز العملة المستخدمة في الميزانية</label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold cursor-not-allowed"
                disabled
              >
                <option value="ج.م">جنيه مصري (ج.م)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نسبة خصم التأمينات الاجتماعية للموظف (%)</label>
              <input
                type="number"
                step="0.01"
                value={gosiRate}
                onChange={(e) => setGosiRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="أدخل نسبة خصم التأمينات..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-red-500"
              />
            </div>
          </div>
        </div>

        {/* Theme & Display Options */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
            <Moon className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              المظهر وتجربة المستخدم
            </h3>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">وضع الرؤية الليلي (Dark Mode)</span>
                <span className="text-[11px] text-slate-400">تفعيل خلفية مظلمة ومريحة للعين أثناء الاستخدام في المساء</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                darkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-0' : '-translate-x-6'
                }`}
              />
            </button>
          </div>
        </div>
      </form>

      {/* Empty space after form */}
    </div>
  );
};

