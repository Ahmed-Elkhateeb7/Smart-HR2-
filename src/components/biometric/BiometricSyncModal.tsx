import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  ArrowDownCircle,
  FileSpreadsheet,
  CheckCheck,
  Building2,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BiometricDevice, BiometricPunchLog, AttendanceRecord, Employee } from '../../types';

interface BiometricSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: BiometricDevice | null;
  logs: BiometricPunchLog[];
  attendanceCount: number;
  newEmployees: Employee[];
  isSyncing: boolean;
  onNavigateToAttendance?: () => void;
}

export const BiometricSyncModal: React.FC<BiometricSyncModalProps> = ({
  isOpen,
  onClose,
  device,
  logs = [],
  attendanceCount = 0,
  newEmployees = [],
  isSyncing,
  onNavigateToAttendance,
}) => {
  const [syncStep, setSyncStep] = useState(0);
  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeNewEmployees = Array.isArray(newEmployees) ? newEmployees : [];

  useEffect(() => {
    if (isSyncing) {
      setSyncStep(1);
      const t1 = setTimeout(() => setSyncStep(2), 600);
      const t2 = setTimeout(() => setSyncStep(3), 1200);
      const t3 = setTimeout(() => setSyncStep(4), 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setSyncStep(4);
    }
  }, [isSyncing]);

  if (!isOpen) return null;

  // Filter distinct employee count from logs
  const distinctEmployees = new Set(safeLogs.map((l) => l.employeeCode)).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 my-4">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSyncing
                ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                : 'bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isSyncing ? 'جاري سحب واستيراد حركات البصمة...' : 'تقرير نتائج سحب ومزامنة جهاز البصمة'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {device ? `${device.name} (${device.ip}:${device.port} - ${device.model})` : 'جهاز البصمة الرئيسي'}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Progress / Step status */}
          {isSyncing ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border-4 border-blue-500 border-t-transparent animate-spin">
                <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {syncStep === 1 && `جاري الاتصال بجهاز البصمة عبر ${device?.ip || 'الشبكة'}:${device?.port || 4370}...`}
                  {syncStep === 2 && 'تم الاتصال! جاري سحب حركات الحضور والانصراف المخزنة...'}
                  {syncStep === 3 && 'جاري مطابقة أكواد الموظفين واحتساب ساعات العمل والورديات...'}
                  {syncStep >= 4 && 'جاري حفظ السجلات وتحديث كشف الحضور...'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يرجى الانتظار بضع ثوانٍ لحين اكتمال المزامنة...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              {safeLogs.length > 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      اكتملت عملية سحب واستيراد البصمات بنجاح!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      تم سحب {safeLogs.length} حركة بصمة وتحديث سجلات الحضور لـ {distinctEmployees} موظفاً مع احتساب أوقات الورديات.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      لم يتم العثور على حركات بصمة جديدة
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      الجهاز غير متصل بالشبكة حالياً أو لا توجد حركات حضور مسجلة بالذاكرة. يمكنك تشغيل سكربت الجسر أو استخدام زر "استيراد ملف البصمات .dat".
                    </p>
                  </div>
                </div>
              )}

              {/* Stats Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {safeLogs.length}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                    حركات البصمة المسحوبة
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {distinctEmployees}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                    الموظفون الحاضرون
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    {attendanceCount || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                    سجلات حضور تم تحديثها
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-center">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {safeNewEmployees.length}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                    موظفون جدد تم تسجيلهم
                  </div>
                </div>
              </div>

              {/* Table of Pulled Punches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>تفاصيل الحركات المسحوبة من الذاكرة</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    {safeLogs.length} حركة
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">كود الموظف</th>
                        <th className="py-2.5 px-3">اسم الموظف</th>
                        <th className="py-2.5 px-3">نوع الحركة</th>
                        <th className="py-2.5 px-3">التاريخ والوقت</th>
                        <th className="py-2.5 px-3">وسيلة التحقق</th>
                        <th className="py-2.5 px-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {safeLogs.slice(0, 50).map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {log.employeeCode}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                            {log.employeeName}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                log.punchType === 'check_in'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              }`}
                            >
                              {log.punchType === 'check_in' ? '🟢 تسجيل حضور (دخول)' : '🔵 تسجيل انصراف (خروج)'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                            {log.timestamp}
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {log.verifyType === 'face'
                              ? '👤 بصمة وجه'
                              : log.verifyType === 'card'
                              ? '💳 كارت ممغنط'
                              : '👆 بصمة إصبع'}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم التضمين</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            تمت المزامنة وحفظ السجلات في الذاكرة بنجاح
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
            >
              إغلاق
            </button>
            {onNavigateToAttendance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAttendance();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <span>عرض كشف الحضور الآن</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
