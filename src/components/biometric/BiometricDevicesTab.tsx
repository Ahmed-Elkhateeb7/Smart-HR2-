import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Plus,
  RefreshCw,
  Zap,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Key,
  Shield,
  FileCode,
  Terminal,
  Calendar,
  Layers,
  ArrowDownCircle,
  HelpCircle,
  Sliders,
  Check
} from 'lucide-react';
import { BiometricDevice, BiometricSyncSettings, BiometricPunchLog, Employee, Shift, AttendanceRecord } from '../../types';
import { testBiometricConnection } from '../../utils/biometricSync';

interface BiometricDevicesTabProps {
  devices: BiometricDevice[];
  settings: BiometricSyncSettings;
  onAddDevice: () => void;
  onEditDevice: (device: BiometricDevice) => void;
  onDeleteDevice: (deviceId: string) => void;
  onUpdateDevice: (device: BiometricDevice) => void;
  onUpdateSettings: (settings: BiometricSyncSettings) => void;
  onSyncDevice: (device: BiometricDevice) => void;
  onSyncAllDevices: () => void;
  onOpenBridgeModal: () => void;
  isSyncing: boolean;
  totalLogsCount: number;
}

export const BiometricDevicesTab: React.FC<BiometricDevicesTabProps> = ({
  devices,
  settings,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
  onUpdateDevice,
  onUpdateSettings,
  onSyncDevice,
  onSyncAllDevices,
  onOpenBridgeModal,
  isSyncing,
  totalLogsCount,
}) => {
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, { success: boolean; msg: string; latency?: number }>>({});

  const handleTestDevice = async (dev: BiometricDevice) => {
    setTestingDeviceId(dev.id);
    const res = await testBiometricConnection(dev);
    setTestingDeviceId(null);
    setTestStatus((prev) => ({
      ...prev,
      [dev.id]: {
        success: res.success,
        msg: res.message,
        latency: res.latencyMs,
      },
    }));

    if (res.success) {
      onUpdateDevice({
        ...dev,
        status: 'online',
        serialNumber: res.serialNumber,
        firmwareVersion: res.firmwareVersion,
        enrolledUsersCount: res.enrolledUsersCount,
        totalPunchesStored: res.totalLogsCount,
      });
    } else {
      onUpdateDevice({ ...dev, status: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Global Daily Auto-Sync Settings */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-indigo-950/30 border border-blue-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  المزامنة اليومية التلقائية للبصمات (Auto Daily Biometric Sync)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    settings.autoDailySync
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {settings.autoDailySync ? '● مفعلة يومياً' : '○ متوقفة مؤقتاً'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                يقوم النظام بالاتصال بأجهزة البصمة المربوطة وسحب حركات الحضور والانصراف تلقائياً يومياً عند الساعة{' '}
                <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {settings.dailySyncTime || '23:59'}
                </strong>{' '}
                مع مطابقة الورديات واحتساب ساعات العمل والغياب والتأخير.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onSyncAllDevices}
              disabled={isSyncing || devices.length === 0}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري سحب البصمات...' : 'سحب البصمات الآن من كافة الأجهزة'}</span>
            </button>

            <button
              type="button"
              onClick={onAddDevice}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>ربط جهاز بصمة جديد</span>
            </button>

            <button
              type="button"
              onClick={onOpenBridgeModal}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>سكربت الشبكة المحلية (Bridge)</span>
            </button>
          </div>
        </div>

        {/* Global Controls & Timing Bar */}
        <div className="mt-4 pt-4 border-t border-blue-200/60 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">تفعيل المزامنة التلقائية:</span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, autoDailySync: !settings.autoDailySync })}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                settings.autoDailySync
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {settings.autoDailySync ? 'مفعل (نشط)' : 'معطل'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">موعد السحب اليومي:</span>
            <input
              type="time"
              value={settings.dailySyncTime || '23:59'}
              onChange={(e) => onUpdateSettings({ ...settings, dailySyncTime: e.target.value })}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-blue-600 dark:text-blue-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">آخر مزامنة ناجحة:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300" dir="ltr">
              {settings.lastGlobalSync || '2026-08-09 23:59:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Devices Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <span>أجهزة البصمة المربوطة بالنظام ({devices.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            يمكنك ربط جهاز أو عدة أجهزة بصمة بجميع الفروع والمواقع لإدارة موحدة وشاملة
          </p>
        </div>
      </div>

      {/* Devices Cards Grid */}
      {devices.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Cpu className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            لا توجد أجهزة بصمة مربوطة حالياً
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            قم بربط جهاز البصمة مرة واحدة بإدخال الموديل وعنوان الـ IP والبورت واسم المستخدم وكلمة المرور لتفعيل الاستيراد اليومي التلقائي.
          </p>
          <button
            type="button"
            onClick={onAddDevice}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ربط جهاز بصمة الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((dev) => {
            const devTest = testStatus[dev.id];
            return (
              <div
                key={dev.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Top Card Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {dev.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            dev.status === 'online'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : dev.status === 'syncing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {dev.status === 'online' ? '🟢 متصل وجاهز' : dev.status === 'syncing' ? '🔵 جاري المزامنة' : '🔴 غير متصل'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {dev.location || 'المقر الرئيسي'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditDevice(dev)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
                      title="تعديل بيانات الجهاز"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDevice(dev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                      title="حذف الجهاز"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Device Specifications Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">الموديل (Model):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.model}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">نوع الجهاز (Type):</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dev.deviceType === 'face'
                        ? '👤 بصمة وجه (Face ID)'
                        : dev.deviceType === 'rfid'
                        ? '💳 كارت ممغنط (RFID)'
                        : dev.deviceType === 'palm'
                        ? '✋ بصمة كف (Palm)'
                        : dev.deviceType === 'hybrid'
                        ? '⚡ هجين متعدد البصمات'
                        : '👆 بصمة إصبع (Fingerprint)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">عنوان IP والبورت:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400" dir="ltr">
                      {dev.ip}:{dev.port}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">اسم المستخدم / ComKey:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {dev.username} / {dev.password ? '●●●●' : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">المزامنة التلقائية:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {dev.autoSyncEnabled ? `يومياً الساعة ${dev.autoSyncTime || '23:59'}` : 'معطلة'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">آخر سحب ناجح:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400" dir="ltr">
                      {dev.lastSyncTime ? dev.lastSyncTime.split(' ')[1] : '-'}
                    </span>
                  </div>
                </div>

                {/* Ping diagnostic result if tested */}
                {devTest && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      devTest.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {devTest.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{devTest.msg}</span>
                    </div>
                    {devTest.latency && (
                      <span className="font-bold font-mono">{devTest.latency}ms</span>
                    )}
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestDevice(dev)}
                    disabled={testingDeviceId === dev.id}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{testingDeviceId === dev.id ? 'جاري الفحص...' : 'فحص الاتصال'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSyncDevice(dev)}
                    disabled={isSyncing}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>سحب البصمة الآن</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
