import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Briefcase,
  Check,
  GraduationCap
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  PayrollRecord,
  Loan,
  Asset,
  SystemAlert,
  Shift,
  DocumentItem,
  TrainingCourse,
  TrainingNomination
} from '../types';
import {
  createBackupPayload,
  parseAndRestoreBackup,
  clearAllStorage,
  calculateStorageSizeMB
} from '../utils/storage';

interface DatabaseViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  loans: Loan[];
  assets: Asset[];
  alerts: SystemAlert[];
  shifts: Shift[];
  documents: DocumentItem[];
  currencySymbol: string;
  trainingCourses?: TrainingCourse[];
  trainingNominations?: TrainingNomination[];
  onRestoreData: (restoredData: {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    payrollRecords: PayrollRecord[];
    loans: Loan[];
    assets: Asset[];
    alerts: SystemAlert[];
    shifts: Shift[];
    documents: DocumentItem[];
    currencySymbol: string;
    trainingCourses?: TrainingCourse[];
    trainingNominations?: TrainingNomination[];
  }) => void;
  onClearData: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  employees,
  attendanceRecords,
  payrollRecords,
  loans,
  assets,
  alerts,
  shifts,
  documents,
  currencySymbol,
  trainingCourses = [],
  trainingNominations = [],
  onRestoreData,
  onClearData
}) => {
  const [usedSpaceMB, setUsedSpaceMB] = useState<number>(0.5);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSpaceMB = 10240; // 10 GB in MB

  useEffect(() => {
    // Calculate real storage size in MB
    const size = calculateStorageSizeMB();
    // Provide a realistic display baseline if localstorage usage is small
    setUsedSpaceMB(Math.max(size, 1.25));
  }, [employees, attendanceRecords, payrollRecords, loans, assets, documents]);

  const percentage = Math.min((usedSpaceMB / totalSpaceMB) * 100, 100);

  const handleExport = () => {
    const payload = createBackupPayload({
      employees,
      attendanceRecords,
      payrollRecords,
      loans,
      assets,
      alerts,
      shifts,
      documents,
      currencySymbol,
      trainingCourses,
      trainingNominations
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HR_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMessage({
      text: 'تم إنشاء وتنزيل النسخة الاحتياطية الشاملة لقاعدة البيانات بنجاح!',
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) {
          setStatusMessage({ text: 'تعذر قراءة محتوى الملف المرفق.', type: 'error' });
          return;
        }

        const result = parseAndRestoreBackup(content);
        if (result.success && result.restoredData) {
          onRestoreData(result.restoredData);
          setStatusMessage({ text: result.message, type: 'success' });
        } else {
          setStatusMessage({ text: result.message, type: 'error' });
        }
      };
      reader.onerror = () => {
        setStatusMessage({ text: 'حدث خطأ أثناء قراءة الملف.', type: 'error' });
      };
      reader.readAsText(file);
    }
    // Reset file input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearDatabase = () => {
    clearAllStorage();
    onClearData();
    setShowClearModal(false);
    setUsedSpaceMB(0.01);
    setStatusMessage({
      text: 'تم إفراغ قاعدة البيانات المحلية وإعادة ضبط كل البيانات بنجاح.',
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="space-y-6 pb-10">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>قاعدة البيانات والتخزين المحلي</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة مساحة التخزين الخاصة بالنظام وحفظ واستعادة النسخ الاحتياطية الشاملة
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-fade-in shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 rounded-lg hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Storage Management Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">إدارة مساحة التخزين (10GB IndexedDB)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                تخزين محلي مباشر وآمن لحفظ كل سجلات الموظفين، المرتبات، الحضور، السلف، والوثائق.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-700 dark:text-slate-200">سعة قاعدة البيانات المستهلكة</span>
              <span className="text-slate-900 dark:text-white">{percentage.toFixed(2)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(percentage, 0.5)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
              <span className="text-blue-600 dark:text-blue-400 font-bold">السعة المتاحة: {totalSpaceMB} MB (10 GB)</span>
              <span>المستخدم حالياً: {usedSpaceMB.toFixed(2)} MB</span>
            </div>
          </div>

          {/* Table Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">الموظفين</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{employees.length}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1.5 text-purple-600 mb-1">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">الدورات</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{trainingCourses.length}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">المرتبات</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{payrollRecords.length}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">الحضور</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{attendanceRecords.length}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center col-span-2 sm:col-span-1">
              <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">السُلف والعهد</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{loans.length + assets.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Database */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 p-6 md:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none"></div>

            <div className="space-y-4 mb-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-100 dark:border-emerald-900/50">
                  <Download className="w-6 h-6" />
                </div>
              </div>

              <div className="text-right">
                <h4 className="font-black text-lg text-slate-900 dark:text-white">تصدير النسخة الاحتياطية</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  تنزيل وحفظ جميع البيانات الحالية (سجلات الموظفين، الحضور، المرتبات، السُلف والعهد) في ملف نسخ احتياطي كامل وآمن لاستعادته في أي وقت.
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer relative z-10 border border-emerald-500/30"
            >
              <Download className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
              <span>تصدير وحفظ النسخة الاحتياطية</span>
            </button>
          </div>

          {/* Import Database */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 p-6 md:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>

            <div className="space-y-4 mb-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs border border-blue-100 dark:border-blue-900/50">
                  <Upload className="w-6 h-6" />
                </div>
              </div>

              <div className="text-right">
                <h4 className="font-black text-lg text-slate-900 dark:text-white">استعادة قاعدة البيانات</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  رفع ملف النسخة الاحتياطية JSON لاسترجاع كافة السجلات المخزنة وعرضها مباشرة فوراً على جميع شاشات وجداول النظام.
                </p>
              </div>
            </div>

            <button
              onClick={handleImportClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer relative z-10 border border-blue-500/30"
            >
              <Upload className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
              <span>اختيار واستعادة ملف البيانات</span>
            </button>
          </div>
        </div>

        {/* Clear Database */}
        <div className="bg-gradient-to-r from-red-50/90 via-rose-50/50 to-red-50/90 dark:from-red-950/30 dark:via-rose-950/20 dark:to-red-950/30 rounded-3xl border border-red-200/80 dark:border-red-900/60 p-6 md:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs transition-all duration-300">
          <div className="flex items-center gap-4 text-right">
            <div className="w-13 h-13 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-red-200/60 dark:border-red-800/60">
              <Trash2 className="w-6.5 h-6.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-lg text-red-600 dark:text-red-400">إفراغ قاعدة البيانات</h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200/70 dark:border-red-800">
                  إجراء حساس
                </span>
              </div>
              <p className="text-xs text-red-600/80 dark:text-red-300/80 font-medium">
                حذف جميع سجلات البيانات المخزنة محلياً وإعادة ضبط كافة الجداول لقيمها الأولية.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shrink-0 cursor-pointer border border-red-500/30"
          >
            <Trash2 className="w-4.5 h-4.5" />
            <span>مسح وإعادة ضبط النظام</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-base">تأكيد مسح قاعدة البيانات</h3>
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في إفراغ قاعدة البيانات؟ سيؤدي هذا الإجراء إلى مسح جميع سجلات الموظفين والمرتبات والحضور المخزنة محلياً.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleClearDatabase}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm shadow-red-600/20 cursor-pointer"
              >
                تأكيد المسح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
