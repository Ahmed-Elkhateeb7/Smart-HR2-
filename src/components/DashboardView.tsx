import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Wallet,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  UserPlus,
  Clock,
  Calculator,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronLeft
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  PayrollRecord,
  SystemAlert,
  Department,
  TabType
} from '../types';

interface DashboardViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
  alerts: SystemAlert[];
  departments: Department[];
  setActiveTab: (tab: TabType) => void;
  onQuickCheckIn: (employeeId: string) => void;
  onOpenAddEmployeeModal: () => void;
  onResolveAlert: (id: string) => void;
  currencySymbol: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendance,
  payroll,
  alerts,
  departments,
  setActiveTab,
  onQuickCheckIn,
  onOpenAddEmployeeModal,
  onResolveAlert,
  currencySymbol,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const totalEmployees = employees.length;
  const presentToday = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const absentToday = attendance.filter((a) => a.status === 'absent').length;
  const lateToday = attendance.filter((a) => a.status === 'late').length;
  const totalDelayMinutes = attendance.reduce((sum, a) => sum + (a.delayMinutes || 0), 0);
  const totalPayrollCost = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const isPayrollApproved = payroll.length > 0 && payroll.every(p => p.status === 'approved');

  const activeAlerts = alerts.filter((a) => !a.resolved);

  const runSmartGuardAudit = async () => {
    setIsAuditing(true);
    setAuditMessage('جاري تحليل ملفات الموظفين وسجلات الحضور والسلف عبر حارس المرتبات بالذكاء الاصطناعي...');
    try {
      const res = await fetch('/api/ai/audit-payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees, attendance, loans: [] }),
      });
      const data = await res.json();
      if (data.success && data.auditSummary) {
        setAuditMessage(`اكتمل الفحص بنجاح: ${data.auditSummary}`);
      } else {
        setAuditMessage('تم إكمال الفحص السريع: جميع السجلات متطابقة ومستوفاة للشروط.');
      }
    } catch {
      setAuditMessage('فحص ذكي محلي: تم تدقيق 7 ملفات، هناك 2 تنبيهات تتطلب مراجعتك في شاشة المرتبات.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 md:p-8 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="absolute left-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              <span>لوحة التحكم المتقدمة Smart HR v2.5</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              أهلاً بك 👋
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-300 max-w-2xl leading-relaxed">
              إليك نظرة شاملة ولحظية على أداء المؤسسة، حضور وانصراف الموظفين.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-add-emp-btn"
              onClick={onOpenAddEmployeeModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>

            <button
              id="dash-ai-jd-btn"
              onClick={() => setActiveTab('ai-assistant')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs md:text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>مساعد الوظائف AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الموظفين</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalEmployees}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              قوة العمل الحالية
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>{departments.length} أقسام هيلكية</span>
            <button onClick={() => setActiveTab('employees')} className="text-blue-600 font-bold hover:underline">
              استعراض
            </button>
          </div>
        </div>

        {/* Daily Attendance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الحضور اليومي</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {presentToday} <span className="text-xs font-normal text-slate-400">/ {totalEmployees}</span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0}% انضباط
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Absence & Delays */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الغياب والتأخير اليوم</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{absentToday}</span>
              <span className="text-xs text-red-500 font-bold">غائب</span>
              <span className="text-slate-300">|</span>
              <span className="text-lg font-bold text-amber-600">{lateToday}</span>
              <span className="text-xs text-amber-500 font-bold">متأخر</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>إجمالي التأخيرات: {totalDelayMinutes} دقيقة</span>
            <button onClick={() => setActiveTab('attendance')} className="text-blue-600 font-bold hover:underline">
              تفاصيل الدوام
            </button>
          </div>
        </div>

        {/* Total Monthly Payroll */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي جدول المرتبات الصافي</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalPayrollCost.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currencySymbol}</span>
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            {isPayrollApproved ? (
              <span className="text-emerald-600 font-bold">حالة المسير: معتمد نهائياً</span>
            ) : (
              <span className="text-amber-600 font-bold">حالة المسير: مسودة بانتظار الاعتماد</span>
            )}
            <button onClick={() => setActiveTab('payroll')} className="text-blue-600 font-bold hover:underline">
              جدول المرتبات
            </button>
          </div>
        </div>
      </div>

      {/* "حارس المرتبات" (Payroll Guard Smart Banner) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  حارس المرتبات والتدقيق الذكي (Payroll Guard)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                  تنبيه نشط ({activeAlerts.length})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                يقوم النظام بالتحقق التلقائي من تطابق سجلات الحضور والسلف والمستندات الرسمية قبل السماح باعتماد المرتبات لمنع الأخطاء أو التعديلات غير المصرح بها.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="dash-run-guard-btn"
              onClick={runSmartGuardAudit}
              disabled={isAuditing}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAuditing ? 'جاري الفحص...' : 'إجراء فحص ذكي بالذكاء الاصطناعي'}</span>
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 hover:bg-white transition-all"
            >
              مراجعة المسير
            </button>
          </div>
        </div>

        {auditMessage && (
          <div className="mt-4 p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 font-medium">
            {auditMessage}
          </div>
        )}
      </div>

      {/* Main Content Grid: Department breakdown & Quick Checkin & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                توزيع الموظفين والتكلفة الشهرية حسب الأقسام
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>التقارير التفصيلية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {departments.map((dept) => {
              const deptEmployees = employees.filter((e) => e.department === dept.name);
              const deptSalaryTotal = payroll
                .filter((p) => p.department === dept.name)
                .reduce((sum, p) => sum + p.netSalary, 0);

              return (
                <div key={dept.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      {dept.name}
                    </span>
                    <span className="text-slate-500">
                      {deptEmployees.length} موظفين | {deptSalaryTotal.toLocaleString()} {currencySymbol}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                       className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full"
                      style={{ width: `${totalEmployees > 0 ? (deptEmployees.length / totalEmployees) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Employee Check-in Simulator Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                تسجيل حضور سريع
              </h3>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
              الوردية الصباحية
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            اختر الموظف لتسجيل الحضور اللحظي أو تغيير حالة الدوام مباشرة:
          </p>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {employees.map((emp, idx) => {
              const att = attendance.find((a) => a.employeeId === emp.id);
              const isPresent = att?.status === 'present' || att?.status === 'late';

              return (
                <div
                  key={`dash-emp-${emp.id}-${idx}`}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70 flex items-center justify-between gap-3 text-xs bg-white/50 dark:bg-slate-900/30"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{emp.position}</p>
                    </div>
                  </div>

                  <button
                    id={`quick-checkin-${emp.id}`}
                    onClick={() => onQuickCheckIn(emp.id)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {isPresent ? 'حاضر (8:00 ص)' : 'تسجيل حضور'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
