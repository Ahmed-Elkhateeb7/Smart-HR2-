import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Trash2,
  Clock,
  Cpu,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BiometricPunchLog, BiometricDevice } from '../../types';

interface BiometricLogsTabProps {
  logs: BiometricPunchLog[];
  devices: BiometricDevice[];
  onClearLogs?: () => void;
  onRefreshPunches?: () => void;
}

export const BiometricLogsTab: React.FC<BiometricLogsTabProps> = ({
  logs,
  devices,
  onClearLogs,
  onRefreshPunches,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !searchTerm ||
        (log.employeeName && log.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.employeeCode && log.employeeCode.includes(searchTerm));

      const matchDate = !selectedDate || log.date === selectedDate;
      const matchDevice = !selectedDeviceId || log.deviceId === selectedDeviceId;
      const matchType = selectedType === 'all' || log.punchType === selectedType;

      return matchSearch && matchDate && matchDevice && matchType;
    });
  }, [logs, searchTerm, selectedDate, selectedDeviceId, selectedType]);

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;

    const dataToExport = filteredLogs.map((l, i) => ({
      'م': i + 1,
      'كود الموظف': l.employeeCode,
      'اسم الموظف': l.employeeName,
      'اسم جهاز البصمة': l.deviceName,
      'التاريخ': l.date,
      'الوقت': l.time,
      'نوع الحركة': l.punchType === 'check_in' ? 'دخول (حضور)' : 'خروج (انصراف)',
      'وسيلة التحقق': l.verifyType === 'face' ? 'بصمة وجه' : l.verifyType === 'card' ? 'كارت' : 'بصمة إصبع',
      'التاريخ والوقت الكامل': l.timestamp,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'حركات البصمة');
    XLSX.writeFile(wb, `سجل_حركات_البصمة_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                سجل حركات البصمة الخام المستوردة (Biometric Transaction Logs)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إجمالي {logs.length} حركة مسجلة من أجهزة البصمة المربوطة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshPunches && (
              <button
                type="button"
                onClick={onRefreshPunches}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredLogs.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>

            {onClearLogs && logs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل حركات البصمة المؤقت؟ (لن تتأثر سجلات الحضور)')) {
                    onClearLogs();
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث باسم الموظف أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
          </div>

          <div>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            >
              <option value="">كافة أجهزة البصمة</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ip})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            >
              <option value="all">كافة أنواع الحركات (دخول / خروج)</option>
              <option value="check_in">🟢 تسجيل حضور (Check In)</option>
              <option value="check_out">🔵 تسجيل انصراف (Check Out)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold">لا توجد حركات بصمة مطابقة للشروط المحددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">كود الموظف</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">جهاز البصمة</th>
                  <th className="py-3 px-4">نوع الحركة</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">وسيلة التحقق</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {log.employeeCode}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.employeeName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                      {log.deviceName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          log.punchType === 'check_in'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                        }`}
                      >
                        {log.punchType === 'check_in' ? '🟢 تسجيل حضور' : '🔵 تسجيل انصراف'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                      {log.verifyType === 'face'
                        ? '👤 بصمة وجه'
                        : log.verifyType === 'card'
                        ? '💳 كارت ممغنط'
                        : '👆 بصمة إصبع'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تمت المعالجة</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
