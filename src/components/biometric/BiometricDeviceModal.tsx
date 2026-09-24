import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Key,
  Server,
  Zap,
  Globe,
  Loader2,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { BiometricDevice, BiometricDeviceType } from '../../types';
import { testBiometricConnection, DeviceDiagnosticResult } from '../../utils/biometricSync';

interface BiometricDeviceModalProps {
  device: BiometricDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: BiometricDevice) => void;
}

const PRESET_MODELS = [
  'ZKTeco K40 / K50 Pro',
  'ZKTeco iClock 880 / G3 / SenseFace',
  'ZKTeco MB20 / MB360 (Face & Finger)',
  'Hikvision DS-K1T804 / DS-K1T671 (Face & Bio)',
  'Dahua ASI7213X / ASA1222E',
  'Suprema BioStation 2 / FaceStation F2',
  'Realand A-F261 / ZD2000',
  'FingerTec AC100 / Face ID 5',
  'جهاز بصمة TCP/IP عام (Generic Biometric)',
];

const DEVICE_TYPES: { id: BiometricDeviceType; label: string; desc: string; icon: string }[] = [
  { id: 'fingerprint', label: 'بصمة إصبع (Fingerprint)', desc: 'قارئ بصمات الأصابع البصري/الحراري', icon: '👆' },
  { id: 'face', label: 'بصمة وجه (Face ID)', desc: 'كاميرات التعرف الذكي على الوجه ثلاثي الأبعاد', icon: '👤' },
  { id: 'rfid', label: 'كارت ذكي / مغناطيسي (RFID/Mifare)', desc: 'قراءة بطاقات الموظفين الممغنطة', icon: '💳' },
  { id: 'palm', label: 'بصمة كف (Palm Scanner)', desc: 'قارئ خطوط وأوردة كف اليد', icon: '✋' },
  { id: 'hybrid', label: 'هجين متعدد البصمات (Multi-Biometric)', desc: 'يدعم بصمة الإصبع والوجه والكارت معاً', icon: '⚡' },
];

export const BiometricDeviceModal: React.FC<BiometricDeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<BiometricDevice>>(() => {
    if (device) return { ...device };
    return {
      name: '',
      model: 'ZKTeco K40 Pro',
      deviceType: 'fingerprint',
      ip: '',
      port: 4370,
      username: 'admin',
      password: '',
      location: '',
      status: 'offline',
      autoSyncEnabled: true,
      autoSyncTime: '23:59',
      syncFrequency: 'daily',
      notes: '',
    };
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<DeviceDiagnosticResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setFormData({ ...device });
    } else {
      setFormData({
        name: '',
        model: 'ZKTeco K40 Pro',
        deviceType: 'fingerprint',
        ip: '',
        port: 4370,
        username: 'admin',
        password: '',
        location: '',
        status: 'offline',
        autoSyncEnabled: true,
        autoSyncTime: '23:59',
        syncFrequency: 'daily',
        notes: '',
      });
    }
    setTestResult(null);
    setErrorMessage(null);
  }, [device, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!formData.ip) {
      setErrorMessage('يرجى إدخال عنوان IP الخاص بجهاز البصمة');
      return;
    }
    setErrorMessage(null);
    setIsTesting(true);
    setTestResult(null);

    const tempDevice: BiometricDevice = {
      id: formData.id || 'temp-test',
      name: formData.name || 'جهاز تجريبي',
      model: formData.model || 'ZKTeco K40',
      deviceType: formData.deviceType || 'fingerprint',
      ip: formData.ip,
      port: Number(formData.port) || 4370,
      username: formData.username || 'admin',
      password: formData.password || '0',
      location: formData.location || '',
      status: 'online',
      autoSyncEnabled: formData.autoSyncEnabled ?? true,
      autoSyncTime: formData.autoSyncTime || '23:59',
      syncFrequency: formData.syncFrequency || 'daily',
    };

    const res = await testBiometricConnection(tempDevice);
    setIsTesting(false);
    setTestResult(res);
    if (res.success) {
      setFormData((prev) => ({
        ...prev,
        status: 'online',
        serialNumber: res.serialNumber,
        firmwareVersion: res.firmwareVersion,
        enrolledUsersCount: res.enrolledUsersCount,
        totalPunchesStored: res.totalLogsCount,
      }));
    } else {
      setFormData((prev) => ({ ...prev, status: 'error' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMessage('يرجى كتابة اسم أو موقع جهاز البصمة');
      return;
    }
    if (!formData.ip?.trim()) {
      setErrorMessage('يرجى كتابة عنوان IP الخاص بجهاز البصمة');
      return;
    }
    if (!formData.port || Number(formData.port) <= 0) {
      setErrorMessage('يرجى كتابة رقم بورت صالح (مثلاً 4370 لأجهزة ZK أو 5005 لـ Hikvision)');
      return;
    }

    const finalDevice: BiometricDevice = {
      id: formData.id || `bio-dev-${Date.now()}`,
      name: formData.name.trim(),
      model: formData.model || 'ZKTeco K40',
      deviceType: formData.deviceType || 'fingerprint',
      ip: formData.ip.trim(),
      port: Number(formData.port) || 4370,
      username: formData.username?.trim() || 'admin',
      password: formData.password?.trim() || '0',
      location: formData.location?.trim() || '',
      status: (formData.status as any) || 'offline',
      autoSyncEnabled: formData.autoSyncEnabled ?? true,
      autoSyncTime: formData.autoSyncTime || '23:59',
      syncFrequency: formData.syncFrequency || 'daily',
      lastSyncTime: formData.lastSyncTime || device?.lastSyncTime,
      lastSyncLogsCount: formData.lastSyncLogsCount || device?.lastSyncLogsCount || 0,
      totalPunchesStored: formData.totalPunchesStored !== undefined ? formData.totalPunchesStored : (device?.totalPunchesStored || 0),
      enrolledUsersCount: formData.enrolledUsersCount !== undefined ? formData.enrolledUsersCount : (device?.enrolledUsersCount || 0),
      firmwareVersion: formData.firmwareVersion || device?.firmwareVersion || '',
      serialNumber: formData.serialNumber || device?.serialNumber || '',
      notes: formData.notes?.trim() || '',
    };

    onSave(finalDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 my-4">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {device ? 'تعديل بيانات وإعدادات جهاز البصمة' : 'ربط وإضافة جهاز بصمة جديد'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ربط جهاز البصمة مرة واحدة للاستيراد والمزامنة التلقائية اليومية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Device Identity & Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                1. بيانات الجهاز والموقع
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الجهاز / الوصف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جهاز البوابة الرئيسية (الاستقبال)"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  موقع الجهاز / الفرع
                </label>
                <input
                  type="text"
                  placeholder="مثال: المقر الرئيسي - الدور الأرضي"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hardware Model & Type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                2. اسم الموديل ونوع الجهاز (Model & Biometric Type)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم موديل الجهاز / الشركة المصنعة <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
                  >
                    {PRESET_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="أو اكتب اسم موديل مخصص..."
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500 outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نوع الجهاز وتقنية التحقق <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.deviceType || 'fingerprint'}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as BiometricDeviceType })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
                >
                  {DEVICE_TYPES.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.icon} {dt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {DEVICE_TYPES.find((d) => d.id === formData.deviceType)?.desc || 'نوع جهاز البصمة المستخدم'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Network Connection & Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                3. بيانات الاتصال بالشبكة (IP & Port & Credentials)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان IP الخاص بالجهاز <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="192.168.1.201"
                    value={formData.ip || ''}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono transition"
                  />
                  <Server className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <div className="mt-1 space-y-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    العنوان الثابت للجهاز على الشبكة المحلية أو عنوان الـ Public IP الخارجي / DDNS
                  </p>
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                    💡 <strong>توجيه المنافذ (Port Forwarding):</strong> إذا فتحت بورت 4370 في الراوتر، ضع هنا الـ <strong>Public IP</strong> للراوتر (وليس 192.168.2.254).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم البورت (Port) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    dir="ltr"
                    placeholder="4370"
                    value={formData.port ?? 4370}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono transition"
                  />
                  <Sliders className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  الافتراضي: 4370 (أجهزة ZKTeco) أو 5005 (Hikvision)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المستخدم (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="admin"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono transition"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  كلمة المرور / مفتاح الاتصال (Password / ComKey)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="0"
                    value={formData.password ?? '0'}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono transition"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  أجهزة ZK تضع ComKey الافتراضي بقيمة "0"
                </p>
              </div>
            </div>

            {/* Test Connection Button & Diagnostic Box */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    فحص واختبار الاتصال بجهاز البصمة
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    يقوم بعمل Ping واختبار استجابة المنفذ والتحقق من كلمة المرور
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري فحص الاتصال...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>اختبار وفحص الاتصال بالجهاز</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex flex-col gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>

                  {testResult.success && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px]">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">سرعة الاستجابة:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">{testResult.latencyMs} ms (سريع جداً)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">السيريال نمبر:</span>
                        <span className="font-mono font-semibold">{testResult.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">المستخدمين المسجلين:</span>
                        <span className="font-bold">{testResult.enrolledUsersCount} موظف</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">إجمالي السجلات:</span>
                        <span className="font-bold">{testResult.totalLogsCount} حركة</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Daily Automatic Sync Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                4. إعدادات المزامنة اليومية التلقائية للبصمة
              </h3>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    تفعيل الاستيراد والمزامنة التلقائية اليومية
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    يقوم النظام بسحب حركات الحضور والانصراف من الجهاز تلقائياً دون تدخل يدوي
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoSyncEnabled ?? true}
                    onChange={(e) => setFormData({ ...formData, autoSyncEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {formData.autoSyncEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-purple-200/50 dark:border-purple-900/30">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      موعد المزامنة اليومي (Sync Time)
                    </label>
                    <input
                      type="time"
                      value={formData.autoSyncTime || '23:59'}
                      onChange={(e) => setFormData({ ...formData, autoSyncTime: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden transition font-mono"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      يُفضل في نهاية اليوم الساعة 23:59 لسحب حركات اليوم كاملة
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      تكرار المزامنة
                    </label>
                    <select
                      value={formData.syncFrequency || 'daily'}
                      onChange={(e) => setFormData({ ...formData, syncFrequency: e.target.value as any })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden transition"
                    >
                      <option value="daily">مرة واحدة يومياً (في الموعد المحدد)</option>
                      <option value="every_6_hours">كل 6 ساعات (4 مرات باليوم)</option>
                      <option value="hourly">كل ساعة (مزامنة دورية مستمرة)</option>
                      <option value="every_30_min">كل 30 دقيقة (مزامنة فورية حية)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{device ? 'حفظ التعديلات' : 'ربط وحفظ جهاز البصمة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
