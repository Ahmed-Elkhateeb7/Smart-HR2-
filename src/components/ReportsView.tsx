import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  Building2,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Eye,
  Plus,
  X,
  Search,
  Briefcase,
  Wallet,
  Calendar,
  Percent,
  Sliders,
  Target,
  Sparkles,
  PieChart as PieChartIcon,
  Layers
} from 'lucide-react';
import { Department, PayrollRecord, Employee, KpiSettings, MonthlyTurnoverRecord, TabType } from '../types';

interface ReportsViewProps {
  departments: Department[];
  onUpdateDepartments?: (depts: Department[]) => void;
  payroll: PayrollRecord[];
  employees: Employee[];
  currencySymbol: string;
  kpiSettings?: KpiSettings | null;
  onUpdateKpiSettings?: (settings: KpiSettings) => void;
  onNavigateTab?: (tab: TabType, filter?: string) => void;
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const PALETTE_COLORS = [
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#0284c7', // Sky
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Cyan
  '#84cc16', // Lime
  '#e11d48', // Rose
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  departments,
  onUpdateDepartments,
  payroll,
  employees,
  currencySymbol,
  kpiSettings,
  onUpdateKpiSettings,
  onNavigateTab,
}) => {
  // Active sub-views & chart types
  const [turnoverChartType, setTurnoverChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [turnoverTimeframe, setTurnoverTimeframe] = useState<'monthly' | 'quarterly'>('monthly');
  const [deptChartType, setDeptChartType] = useState<'donut' | 'pie' | 'bar'>('donut');
  const [deptSortBy, setDeptSortBy] = useState<'count' | 'budget' | 'name'>('count');

  // Modals state
  const [showKpiEditorModal, setShowKpiEditorModal] = useState(false);
  const [editorTab, setEditorTab] = useState<'turnover' | 'departments' | 'benchmark'>('turnover');
  const [selectedDeptForDrilldown, setSelectedDeptForDrilldown] = useState<Department | null>(null);
  const [drilldownSearchTerm, setDrilldownSearchTerm] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Selected KPI configuration with default fallbacks
  const currentYear = new Date().getFullYear();
  const targetMaxTurnover = kpiSettings?.targetMaxTurnoverRate ?? 10; // 10% default target benchmark
  const selectedYear = kpiSettings?.selectedYear ?? currentYear;

  // Trigger brief floating toast
  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // -------------------------------------------------------------
  // 1. TURNOVER RATE ENGINE (SYSTEM-CONNECTED & USER-CUSTOMIZABLE)
  // -------------------------------------------------------------
  const monthlyTurnoverData = useMemo(() => {
    // If user has custom overrides saved in kpiSettings, merge them
    const customData = kpiSettings?.customTurnoverData || {};

    const totalEmployeesCount = employees.length;

    const data: MonthlyTurnoverRecord[] = MONTH_NAMES_AR.map((name, idx) => {
      const monthKey = String(idx + 1).padStart(2, '0');
      const quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' =
        idx < 3 ? 'Q1' : idx < 6 ? 'Q2' : idx < 9 ? 'Q3' : 'Q4';

      if (customData[monthKey]) {
        return {
          ...customData[monthKey],
          monthKey,
          monthName: name,
          quarter,
        };
      }

      // Auto-calculate from system employees database
      // Hires: employees whose joinDate matches this month of selectedYear
      const hiresInMonth = employees.filter((emp) => {
        if (!emp.joinDate) return false;
        const parts = emp.joinDate.split('-');
        if (parts.length < 2) return false;
        const [y, m] = parts;
        return Number(y) === selectedYear && Number(m) === idx + 1;
      }).length;

      // Resignations / Departures: employees whose status is 'resigned'
      const departuresInMonth = employees.filter((emp) => {
        if (emp.status !== 'resigned') return false;
        if (emp.joinDate) {
          const parts = emp.joinDate.split('-');
          if (parts.length >= 2) {
            const [y, m] = parts;
            return Number(y) === selectedYear && Number(m) === idx + 1;
          }
        }
        return false;
      }).length;

      const rate = totalEmployeesCount > 0 ? Number(((departuresInMonth / totalEmployeesCount) * 100).toFixed(1)) : 0;

      return {
        monthKey,
        monthName: name,
        quarter,
        hires: hiresInMonth,
        departures: departuresInMonth,
        activeCount: totalEmployeesCount,
        turnoverRate: rate,
        primaryReason: departuresInMonth > 0 ? 'مغادرة مسجلة بالنظام' : '-',
        notes: undefined,
      };
    });

    return data;
  }, [employees, kpiSettings, selectedYear]);

  // Quarterly aggregated turnover data
  const quarterlyTurnoverData = useMemo(() => {
    const quarters: { [key in 'Q1' | 'Q2' | 'Q3' | 'Q4']: { name: string; hires: number; departures: number; count: number; avgActive: number } } = {
      Q1: { name: 'الربع الأول (Q1)', hires: 0, departures: 0, count: 0, avgActive: 0 },
      Q2: { name: 'الربع الثاني (Q2)', hires: 0, departures: 0, count: 0, avgActive: 0 },
      Q3: { name: 'الربع الثالث (Q3)', hires: 0, departures: 0, count: 0, avgActive: 0 },
      Q4: { name: 'الربع الرابع (Q4)', hires: 0, departures: 0, count: 0, avgActive: 0 },
    };

    monthlyTurnoverData.forEach((m) => {
      quarters[m.quarter].hires += m.hires;
      quarters[m.quarter].departures += m.departures;
      quarters[m.quarter].count += 1;
      quarters[m.quarter].avgActive += m.activeCount;
    });

    return Object.entries(quarters).map(([qKey, val]) => {
      const avgAct = val.count > 0 ? val.avgActive / val.count : employees.length;
      const rate = avgAct > 0 ? Number(((val.departures / avgAct) * 100).toFixed(1)) : 0;
      return {
        quarterKey: qKey,
        name: val.name,
        hires: val.hires,
        departures: val.departures,
        turnoverRate: rate,
        activeCount: Math.round(avgAct),
      };
    });
  }, [monthlyTurnoverData, employees.length]);

  // High level turnover summary stats
  const turnoverStats = useMemo(() => {
    const totalHires = monthlyTurnoverData.reduce((sum, d) => sum + d.hires, 0);
    const totalDepartures = monthlyTurnoverData.reduce((sum, d) => sum + d.departures, 0);
    const avgEmployees = employees.length;
    const annualTurnoverRate = avgEmployees > 0 ? Number(((totalDepartures / avgEmployees) * 100).toFixed(1)) : 0;
    const retentionRate = avgEmployees > 0 ? Number(Math.max(0, 100 - annualTurnoverRate).toFixed(1)) : 100;

    // Find peak departure month
    let peakMonth = monthlyTurnoverData[0];
    let maxDepartures = 0;
    monthlyTurnoverData.forEach((d) => {
      if (d.departures > maxDepartures) {
        maxDepartures = d.departures;
        peakMonth = d;
      }
    });

    return {
      totalHires,
      totalDepartures,
      netWorkforceChange: totalHires - totalDepartures,
      annualTurnoverRate,
      retentionRate,
      peakMonth,
      hasDepartures: maxDepartures > 0,
      isBelowTarget: annualTurnoverRate <= targetMaxTurnover,
    };
  }, [monthlyTurnoverData, targetMaxTurnover, employees.length]);

  // -------------------------------------------------------------
  // 2. DEPARTMENT DISTRIBUTION ENGINE (SYSTEM-CONNECTED)
  // -------------------------------------------------------------
  const departmentDistributionData = useMemo(() => {
    const totalEmp = employees.length;

    const list = departments.map((dept, idx) => {
      const assignedEmps = employees.filter((e) => e.department === dept.name);
      const count = assignedEmps.length;
      const deptPayroll = payroll
        .filter((p) => p.department === dept.name)
        .reduce((sum, p) => sum + p.netSalary, 0);

      const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];

      return {
        id: dept.id,
        name: dept.name,
        managerName: dept.managerName,
        monthlyBudget: dept.monthlyBudget,
        actualPayrollCost: deptPayroll,
        count,
        percentage: totalEmp > 0 ? Number(((count / totalEmp) * 100).toFixed(1)) : 0,
        color,
        employeesList: assignedEmps,
      };
    });

    // Also check if any employee has a custom department not in departments array
    const knownDeptNames = new Set(departments.map((d) => d.name));
    const unlistedEmployees = employees.filter((e) => !e.department || !knownDeptNames.has(e.department));
    if (unlistedEmployees.length > 0) {
      const unlistedPayroll = payroll
        .filter((p) => !p.department || !knownDeptNames.has(p.department))
        .reduce((sum, p) => sum + p.netSalary, 0);
      list.push({
        id: 'dep-other',
        name: 'غير محدد / أخرى',
        managerName: 'غير محدد',
        monthlyBudget: 0,
        actualPayrollCost: unlistedPayroll,
        count: unlistedEmployees.length,
        percentage: totalEmp > 0 ? Number(((unlistedEmployees.length / totalEmp) * 100).toFixed(1)) : 0,
        color: '#94a3b8',
        employeesList: unlistedEmployees,
      });
    }

    if (deptSortBy === 'count') {
      return [...list].sort((a, b) => b.count - a.count);
    } else if (deptSortBy === 'budget') {
      return [...list].sort((a, b) => b.monthlyBudget - a.monthlyBudget);
    } else {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }
  }, [departments, employees, payroll, deptSortBy]);

  const totalDepartmentHeadcount = useMemo(() => {
    return departmentDistributionData.reduce((sum, d) => sum + d.count, 0);
  }, [departmentDistributionData]);

  const largestDepartment = useMemo(() => {
    if (departmentDistributionData.length === 0) return null;
    return [...departmentDistributionData].sort((a, b) => b.count - a.count)[0];
  }, [departmentDistributionData]);

  // Financial summary metrics
  const totalPayrollCost = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalOvertimeCost = payroll.reduce((sum, p) => sum + p.overtimePay, 0);
  const totalOvertimeHours = payroll.reduce((sum, p) => sum + (p.overtimeHoursDay || 0) + (p.overtimeHoursNight || 0), 0);
  const totalDeductionsCost = payroll.reduce((sum, p) => sum + p.deductions + p.latePenaltyDeduction, 0);

  // -------------------------------------------------------------
  // EDITING STATE IN MODAL
  // -------------------------------------------------------------
  const [draftTurnover, setDraftTurnover] = useState<Record<string, { hires: number; departures: number; reason: string; notes: string }>>({});
  const [draftTargetTurnover, setDraftTargetTurnover] = useState(targetMaxTurnover);
  const [draftDepts, setDraftDepts] = useState<Department[]>([]);

  const handleOpenKpiEditor = () => {
    const initialTurnoverDraft: Record<string, { hires: number; departures: number; reason: string; notes: string }> = {};
    monthlyTurnoverData.forEach((m) => {
      initialTurnoverDraft[m.monthKey] = {
        hires: m.hires,
        departures: m.departures,
        reason: m.primaryReason || '',
        notes: m.notes || '',
      };
    });

    // Clean any lingering dummy managers/budgets
    const cleanedDepts = departments.map((d) => {
      const isDummyManager = d.managerName && [
        'م. أحمد علي', 'أ. سارة محمود', 'أ. كريم حسن', 'أ. طارق عبدالفتاح',
        'م. خالد مصطفى', 'د. محمد إبراهيم', 'أ. محمود سامي', 'م. ياسمين نبيل',
        'أ. حسن السيد', 'أ. عمر الخولي', 'مدير القسم'
      ].includes(d.managerName.trim());

      return {
        ...d,
        managerName: isDummyManager ? '' : (d.managerName || ''),
        monthlyBudget: isDummyManager && [150000, 80000, 120000, 95000, 70000, 200000, 65000, 75000, 85000, 90000, 50000].includes(d.monthlyBudget)
          ? 0
          : (d.monthlyBudget || 0),
      };
    });

    setDraftTurnover(initialTurnoverDraft);
    setDraftTargetTurnover(targetMaxTurnover);
    setDraftDepts(JSON.parse(JSON.stringify(cleanedDepts)));
    setShowKpiEditorModal(true);
  };

  const handleSaveKpiEditor = () => {
    // Build custom turnover map
    const customTurnoverMap: Record<string, MonthlyTurnoverRecord> = {};
    MONTH_NAMES_AR.forEach((name, idx) => {
      const monthKey = String(idx + 1).padStart(2, '0');
      const draft = draftTurnover[monthKey] || { hires: 0, departures: 0, reason: '', notes: '' };
      const quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' =
        idx < 3 ? 'Q1' : idx < 6 ? 'Q2' : idx < 9 ? 'Q3' : 'Q4';
      const avgAct = employees.length;
      const rate = avgAct > 0 ? Number(((draft.departures / avgAct) * 100).toFixed(1)) : 0;

      customTurnoverMap[monthKey] = {
        monthKey,
        monthName: name,
        quarter,
        hires: Number(draft.hires) || 0,
        departures: Number(draft.departures) || 0,
        activeCount: avgAct,
        turnoverRate: rate,
        primaryReason: draft.reason,
        notes: draft.notes,
      };
    });

    const newKpiSettings: KpiSettings = {
      targetMaxTurnoverRate: Number(draftTargetTurnover) || 10,
      selectedYear,
      customTurnoverData: customTurnoverMap,
    };

    if (onUpdateKpiSettings) {
      onUpdateKpiSettings(newKpiSettings);
    }

    if (onUpdateDepartments && draftDepts.length > 0) {
      onUpdateDepartments(draftDepts);
    }

    setShowKpiEditorModal(false);
    showToast('تم حفظ وتحديث مؤشرات الأداء والبيانات بنجاح!');
  };

  const handleResetToAutoSync = () => {
    if (onUpdateKpiSettings) {
      onUpdateKpiSettings({
        targetMaxTurnoverRate: 10,
        selectedYear: currentYear,
        customTurnoverData: undefined,
      });
    }
    if (onUpdateDepartments) {
      const resetDepts = departments.map((d) => ({
        ...d,
        managerName: '',
        monthlyBudget: 0,
      }));
      onUpdateDepartments(resetDepts);
    }
    setShowKpiEditorModal(false);
    showToast('تمت إعادة المزامنة التلقائية وإزالة القيم التجريبية بنجاح!');
  };

  // -------------------------------------------------------------
  // EXPORT TO EXCEL / CSV
  // -------------------------------------------------------------
  const exportExecutiveReportToExcel = () => {
    const dateStr = new Date().toLocaleDateString('ar-EG');

    const summaryLines = [
      ['تقرير مؤشرات الأداء التنفيذية (KPIs) ومعدل الدوران وتوزيع الأقسام'],
      [`تاريخ التقرير:`, dateStr],
      [`السنة المالية:`, `${selectedYear}`],
      [''],
      ['--- ملخص مؤشرات الأداء الاستراتيجية (Executive KPIs Summary) ---'],
      ['إجمالي القوة العاملة (Total Workforce)', `${totalDepartmentHeadcount} موظف`],
      ['معدل الدوران الوظيفي السنوي (Annual Turnover Rate)', `${turnoverStats.annualTurnoverRate}%`],
      ['سقف معدل الدوران المستهدف (Target Benchmark)', `${targetMaxTurnover}%`],
      ['نسبة الاستبقاء والاستقرار الوظيفي (Retention Rate)', `${turnoverStats.retentionRate}%`],
      ['إجمالي التعيينات الجديدة (Total New Hires)', `${turnoverStats.totalHires} موظف`],
      ['إجمالي الاستقالات والمغادرات (Total Departures)', `${turnoverStats.totalDepartures} موظف`],
      ['صافي نمو العمالة (Net Growth)', `${turnoverStats.netWorkforceChange > 0 ? '+' : ''}${turnoverStats.netWorkforceChange}`],
      ['شهر ذروة المغادرات (Peak Month)', `${turnoverStats.peakMonth.monthName} (${turnoverStats.peakMonth.departures} مغادرات)`],
      [''],
      ['--- جدول حركة الدوران الوظيفي الشهري (Monthly Turnover Breakdown) ---'],
      ['الشهر', 'الربع السنوي', 'التعيينات الجديدة', 'الاستقالات / إنهاء الخدمة', 'معدل الدوران (%)', 'السبب الرئيسي', 'ملاحظات']
    ];

    const turnoverRows = monthlyTurnoverData.map((m) => [
      m.monthName,
      m.quarter,
      m.hires,
      m.departures,
      `${m.turnoverRate}%`,
      m.primaryReason || '-',
      m.notes || '-'
    ]);

    const deptHeaderLines = [
      [''],
      ['--- توزيع الموظفين حسب الأقسام (Department Workforce & Budget Distribution) ---'],
      ['اسم القسم', 'المدير المسؤول', 'عدد الموظفين', 'النسبة من إجمالي المنشأة (%)', 'الميزانية الشهرية المعتمدة', 'الكلفة الفعلية للمرتبات']
    ];

    const deptRows = departmentDistributionData.map((dept) => [
      dept.name,
      dept.managerName || 'غير محدد',
      dept.count,
      `${dept.percentage}%`,
      dept.monthlyBudget > 0 ? `${dept.monthlyBudget} ${currencySymbol}` : 'غير محددة',
      `${dept.actualPayrollCost} ${currencySymbol}`
    ]);

    const financialLines = [
      [''],
      ['--- الملخص المالي للأجور والمستحقات ---'],
      ['إجمالي فاتورة المرتبات الشهرية', `${totalPayrollCost} ${currencySymbol}`],
      ['تكلفة الساعات الإضافية (Overtime)', `${totalOvertimeCost} ${currencySymbol} (${totalOvertimeHours} ساعة)`],
      ['إجمالي الخصومات والجزاءات', `${totalDeductionsCost} ${currencySymbol}`]
    ];

    const csvContent = [
      ...summaryLines.map((line) => line.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ...turnoverRows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ...deptHeaderLines.map((line) => line.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ...deptRows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ...financialLines.map((line) => line.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_مؤشرات_الأداء_والدوران_الوظيفي_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف الإكسيل (CSV) بنجاح!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs md:text-sm font-bold">{notificationMsg}</span>
        </div>
      )}

      {/* Main View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              التقارير التنفيذية KPIs
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              مؤشرات الأداء الاستراتيجية {selectedYear}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
            تحليل معدل الدوران الوظيفي (Turnover Rate)، استقطاب وتعيينات الكفاءات، توزيع القوى العاملة بالأقسام، وربط المنظومة مع منصات التوظيف وميزانيات الأجور.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 self-start lg:self-auto">
          <button
            id="edit-kpi-btn"
            onClick={handleOpenKpiEditor}
            className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 font-bold text-xs shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            title="تعديل وتخصيص بيانات مؤشرات الأداء والأقسام"
          >
            <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>تعديل المؤشرات (KPIs)</span>
          </button>

          <button
            id="reset-kpi-sync-btn"
            onClick={handleResetToAutoSync}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="إعادة المزامنة التلقائية مع قاعدة بيانات الموظفين"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">مزامنة النظام</span>
          </button>

          <button
            onClick={exportExecutiveReportToExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>تصدير إكسيل (Excel)</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top High-Level Strategic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Turnover Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">معدل الدوران السنوي (Turnover Rate)</span>
            <div className={`p-2 rounded-xl ${turnoverStats.isBelowTarget ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-red-50 dark:bg-red-950 text-red-600'}`}>
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {turnoverStats.annualTurnoverRate}%
            </span>
            <span className="text-xs font-bold text-slate-400">
              (المستهدف: &le; {targetMaxTurnover}%)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold">
            {turnoverStats.isBelowTarget ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>معدل صحي ومستقر للعمالة ✓</span>
              </span>
            ) : (
              <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>تجاوز الحد المستهدف - يتطلب مراجعة</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: New Hires vs Departures */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">حركة التعيينات والاستقالات</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{turnoverStats.totalHires}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">تعيين</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <UserMinus className="w-4 h-4 text-rose-500" />
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                -{turnoverStats.totalDepartures}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">مغادرة</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            صافي نمو القوة العاملة:{' '}
            <strong className={turnoverStats.netWorkforceChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {turnoverStats.netWorkforceChange > 0 ? `+${turnoverStats.netWorkforceChange}` : turnoverStats.netWorkforceChange} موظف
            </strong>
          </p>
        </div>

        {/* Card 3: Retention Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة الاستبقاء الوظيفي (Retention)</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {turnoverStats.retentionRate}%
            </span>
            <span className="text-xs font-bold text-slate-400">استقرار</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            شهر الذروة:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {turnoverStats.hasDepartures
                ? `${turnoverStats.peakMonth.monthName} (${turnoverStats.peakMonth.departures} خروج)`
                : 'لا توجد مغادرات'}
            </strong>
          </p>
        </div>

        {/* Card 4: Total Workforce & Departments */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي القوى العاملة والأقسام</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalDepartmentHeadcount}
            </span>
            <span className="text-xs font-bold text-slate-400">
              موظف موزعين على {departments.length} أقسام
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
            الأعلى كثافة: <strong className="text-blue-600 dark:text-blue-400">{largestDepartment?.name || 'عام'} ({largestDepartment?.count || 0} موظف)</strong>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TURNOVER RATE CHART (معدل الدوران الوظيفي)                       */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                رسم بياني لمعدل الدوران الوظيفي (Turnover Rate)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مقارنة استقالات ومغادرات الموظفين بالتعيينات الجديدة ومعدل الدوران الزمني على مدار الشهور والأرباع السنوية.
            </p>
          </div>

          {/* Controls: Timeframe (Monthly / Quarterly) & Chart Type (Line / Bar / Area) */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                onClick={() => setTurnoverTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  turnoverTimeframe === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                شهري (12 شهر)
              </button>
              <button
                onClick={() => setTurnoverTimeframe('quarterly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  turnoverTimeframe === 'quarterly'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                أرباع سنوية (Q1-Q4)
              </button>
            </div>

            {/* Chart type selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                onClick={() => setTurnoverChartType('line')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  turnoverChartType === 'line'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="خط زمني (Line Chart)"
              >
                <span>خط زمني</span>
              </button>
              <button
                onClick={() => setTurnoverChartType('bar')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  turnoverChartType === 'bar'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="أعمدة مزدوجة (Bar Chart)"
              >
                <span>أعمدة</span>
              </button>
              <button
                onClick={() => setTurnoverChartType('area')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  turnoverChartType === 'area'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="مساحي انسيابي (Area Chart)"
              >
                <span>مساحي</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Chart Canvas */}
        <div className="h-80 w-full pt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {turnoverChartType === 'line' ? (
              <LineChart
                data={turnoverTimeframe === 'monthly' ? monthlyTurnoverData : quarterlyTurnoverData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey={turnoverTimeframe === 'monthly' ? 'monthName' : 'name'}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{ value: 'عدد الموظفين', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{ value: 'معدل الدوران %', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip content={<CustomTurnoverTooltip currencySymbol={currencySymbol} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ direction: 'rtl', fontSize: 12, fontWeight: 700 }} />
                <ReferenceLine yAxisId="right" y={targetMaxTurnover} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `سقف المستهدف (${targetMaxTurnover}%)`, fill: '#ef4444', fontSize: 10, position: 'top' }} />
                <Line yAxisId="left" type="monotone" dataKey="hires" name="تعيينات جديدة" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 7 }} />
                <Line yAxisId="left" type="monotone" dataKey="departures" name="استقالات وخروج" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 7 }} />
                <Line yAxisId="right" type="monotone" dataKey="turnoverRate" name="معدل الدوران (%)" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            ) : turnoverChartType === 'bar' ? (
              <BarChart
                data={turnoverTimeframe === 'monthly' ? monthlyTurnoverData : quarterlyTurnoverData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey={turnoverTimeframe === 'monthly' ? 'monthName' : 'name'}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTurnoverTooltip currencySymbol={currencySymbol} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ direction: 'rtl', fontSize: 12, fontWeight: 700 }} />
                <Bar yAxisId="left" dataKey="hires" name="تعيينات جديدة" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Bar yAxisId="left" dataKey="departures" name="استقالات وخروج" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="turnoverRate" name="معدل الدوران (%)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
              </BarChart>
            ) : (
              <AreaChart
                data={turnoverTimeframe === 'monthly' ? monthlyTurnoverData : quarterlyTurnoverData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDepartures" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey={turnoverTimeframe === 'monthly' ? 'monthName' : 'name'} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTurnoverTooltip currencySymbol={currencySymbol} />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ direction: 'rtl', fontSize: 12, fontWeight: 700 }} />
                <Area yAxisId="left" type="monotone" dataKey="hires" name="تعيينات جديدة" stroke="#10b981" fillOpacity={1} fill="url(#colorHires)" strokeWidth={2.5} />
                <Area yAxisId="left" type="monotone" dataKey="departures" name="استقالات وخروج" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDepartures)" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="turnoverRate" name="معدل الدوران (%)" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Strategic Analysis & Insights Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-xs">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>شهر الذروة في الاستقالات</span>
            </div>
            {turnoverStats.hasDepartures ? (
              <>
                <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {turnoverStats.peakMonth.monthName} ({turnoverStats.peakMonth.departures} حالات خروج)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  السبب المسجل: {turnoverStats.peakMonth.primaryReason || 'مغادرة مسجلة'}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  لا توجد استقالات
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  سجل خالٍ من الاستقالات والمغادرات لعام {selectedYear}
                </p>
              </>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-xs">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span>أعلى فترات الاستقطاب والتعيين</span>
            </div>
            {turnoverStats.totalHires > 0 ? (
              <>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {monthlyTurnoverData.reduce((prev, curr) => (curr.hires > prev.hires ? curr : prev), monthlyTurnoverData[0]).monthName} (+{monthlyTurnoverData.reduce((prev, curr) => (curr.hires > prev.hires ? curr : prev), monthlyTurnoverData[0]).hires} تعيين)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  إجمالي التعيينات: {turnoverStats.totalHires} موظف مسجل
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-black text-slate-700 dark:text-slate-300 mt-1">
                  لا توجد تعيينات جديدة
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  لم تسجل تعيينات جديدة خلال عام {selectedYear}
                </p>
              </>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>التحليل والمؤشر التنفيذي</span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-1.5 leading-relaxed">
                {employees.length === 0
                  ? 'لا توجد بيانات موظفين مسجلة بالنظام حالياً. سيتم احتساب المؤشرات تلقائياً عند إضافة الموظفين أو إدخال قيم مخصصة.'
                  : !turnoverStats.hasDepartures
                  ? `استقرار وظيفي ممتاز بنسبة ${turnoverStats.retentionRate}% مع الحفاظ التام على الكفاءات في عام ${selectedYear}.`
                  : `معدل الاستبقاء بلغ ${turnoverStats.retentionRate}% ومعدل الدوران ${turnoverStats.annualTurnoverRate}% (${turnoverStats.isBelowTarget ? 'ضمن المعدل المستهدف' : 'تجاوز المعدل المستهدف'}).`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DEPARTMENT DISTRIBUTION CHART (توزيع الموظفين حسب الأقسام)      */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                رسم بياني لتوزيع الموظفين حسب الأقسام (Department Distribution)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              يوضح نسبة وحجم العمالة في كل قطاع وقسم بالمنشأة (الجودة، الإنتاج، المبيعات، تقنية المعلومات، المالية، إلخ).
            </p>
          </div>

          {/* Controls: Chart Style (Donut / Pie / Bar) & Sort */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-bold">ترتيب:</span>
              <select
                value={deptSortBy}
                onChange={(e) => setDeptSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
              >
                <option value="count">الأعلى عدداً</option>
                <option value="budget">الأعلى ميزانية</option>
                <option value="name">أبجدياً</option>
              </select>
            </div>

            {/* Chart type */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                onClick={() => setDeptChartType('donut')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  deptChartType === 'donut'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                دائري مجوف (Donut)
              </button>
              <button
                onClick={() => setDeptChartType('pie')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  deptChartType === 'pie'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                دائري (Pie)
              </button>
              <button
                onClick={() => setDeptChartType('bar')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  deptChartType === 'bar'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                أعمدة أفقية
              </button>
            </div>
          </div>
        </div>

        {/* Visual Chart + Department Detail Legend Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Chart Display (5 cols) */}
          <div className="lg:col-span-5 h-80 w-full relative flex items-center justify-center" dir="ltr">
            {totalDepartmentHeadcount === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full h-full" dir="rtl">
                <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">لا يوجد موظفون مسجلون بالأقسام حالياً</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  عند إضافة موظفين وتوزيعهم على الأقسام، سيتم رسم المخطط البياني وتوزيع النسب تلقائياً.
                </p>
              </div>
            ) : deptChartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentDistributionData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 60, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} unit=" موظف" />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} width={80} />
                  <Tooltip content={<CustomDeptTooltip totalHeadcount={totalDepartmentHeadcount} />} />
                  <Bar dataKey="count" name="عدد الموظفين" radius={[0, 8, 8, 0]}>
                    {departmentDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentDistributionData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={deptChartType === 'donut' ? 65 : 0}
                      outerRadius={105}
                      paddingAngle={deptChartType === 'donut' ? 3 : 1}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {departmentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomDeptTooltip totalHeadcount={totalDepartmentHeadcount} />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center text for Donut chart */}
                {deptChartType === 'donut' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {totalDepartmentHeadcount}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">إجمالي الموظفين</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Interactive Department Breakdown Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-3 max-h-96 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departmentDistributionData.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: dept.color }}
                        />
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {dept.name}
                        </h4>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
                        {dept.count} موظف ({dept.percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(dept.percentage, 100)}%`, backgroundColor: dept.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                      <span>المدير: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{dept.managerName ? dept.managerName : 'غير محدد'}</strong></span>
                      <span>الميزانية: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{dept.monthlyBudget > 0 ? `${dept.monthlyBudget.toLocaleString()} ${currencySymbol}` : 'غير محددة'}</strong></span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => {
                        setSelectedDeptForDrilldown(departments.find((d) => d.id === dept.id) || null);
                        setDrilldownSearchTerm('');
                      }}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>عرض موظفي القسم ({dept.employeesList.length})</span>
                    </button>

                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('employees', dept.name)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                        title="الانتقال لصفحة الموظفين مع فلترة القسم"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: FINANCIAL & PAYROLL EXECUTIVE SUMMARY                          */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                الملخص المالي ومصروفات الأجور المعتمدة
              </h3>
              <p className="text-xs text-slate-400">
                متابعة استهلاك ميزانية الأجور الشهرية والإضافي والخصومات التنفيذية.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-xs font-bold text-slate-400 block">إجمالي كلفة المرتبات الشهرية</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalPayrollCost.toLocaleString()} {currencySymbol}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-2">ضمن الميزانية الشهرية المعتمدة ✓</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-xs font-bold text-slate-400 block">تكلفة الساعات الإضافية (Overtime)</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              +{totalOvertimeCost.toLocaleString()} {currencySymbol}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">شملت {totalOvertimeHours} ساعة عمل إضافي هذا الشهر</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-xs font-bold text-slate-400 block">وفورات جزاءات التأخير والخصم</span>
            <p className="text-2xl font-black text-rose-500 mt-1">
              -{totalDeductionsCost.toLocaleString()} {currencySymbol}
            </p>
            <p className="text-[10px] text-slate-400 mt-2">خصمت تلقائياً بموجب السياسات المعتمدة</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: KPI & TURNOVER CUSTOMIZATION EDITOR (تعديل وتخصيص المؤشرات)       */}
      {/* ========================================================================= */}
      {showKpiEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    تعديل وتخصيص مؤشرات الأداء (KPIs Editor)
                  </h3>
                  <p className="text-xs text-slate-400">
                    تعديل حركة التعيينات والاستقالات، وضبط أهداف الدوران الوظيفي وميزانيات الأقسام.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKpiEditorModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs inside modal */}
            <div className="flex items-center px-5 pt-3 border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setEditorTab('turnover')}
                className={`pb-3 px-3 border-b-2 transition-all ${
                  editorTab === 'turnover'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                حركة التعيينات والاستقالات (الدوران الوظيفي)
              </button>
              <button
                onClick={() => setEditorTab('departments')}
                className={`pb-3 px-3 border-b-2 transition-all ${
                  editorTab === 'departments'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                إدارة الأقسام والميزانيات
              </button>
              <button
                onClick={() => setEditorTab('benchmark')}
                className={`pb-3 px-3 border-b-2 transition-all ${
                  editorTab === 'benchmark'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                الأهداف السنوية والمعايير القياسية
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Tab 1: Monthly Turnover Editor */}
              {editorTab === 'turnover' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-800 dark:text-blue-300 font-medium">
                    💡 يمكنك تعديل عدد التعيينات الجديدة والاستقالات لكل شهر ووضع سبب رئيسي أو ملاحظات لتظهر في التحليل التنفيذي.
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5">الشهر</th>
                          <th className="p-2.5">تعيينات جديدة</th>
                          <th className="p-2.5">استقالات / خروج</th>
                          <th className="p-2.5">السبب الرئيسي للخروج</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {MONTH_NAMES_AR.map((monthName, idx) => {
                          const mKey = String(idx + 1).padStart(2, '0');
                          const draft = draftTurnover[mKey] || { hires: 0, departures: 0, reason: '', notes: '' };

                          return (
                            <tr key={mKey} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{monthName}</td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  min={0}
                                  value={draft.hires}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setDraftTurnover((prev) => ({
                                      ...prev,
                                      [mKey]: { ...draft, hires: val },
                                    }));
                                  }}
                                  className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  min={0}
                                  value={draft.departures}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setDraftTurnover((prev) => ({
                                      ...prev,
                                      [mKey]: { ...draft, departures: val },
                                    }));
                                  }}
                                  className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  placeholder="أسباب الذروة أو ترك العمل..."
                                  value={draft.reason}
                                  onChange={(e) => {
                                    setDraftTurnover((prev) => ({
                                      ...prev,
                                      [mKey]: { ...draft, reason: e.target.value },
                                    }));
                                  }}
                                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Departments Management */}
              {editorTab === 'departments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">قائمة الأقسام وميزانياتها</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `dep-${Date.now()}`;
                        setDraftDepts([
                          ...draftDepts,
                          {
                            id: newId,
                            name: `قسم جديد ${draftDepts.length + 1}`,
                            managerName: '',
                            employeeCount: 0,
                            monthlyBudget: 0,
                          },
                        ]);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة قسم جديد</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draftDepts.map((d, i) => (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                      >
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">اسم القسم</label>
                          <input
                            type="text"
                            placeholder="مثال: قسم الجودة، المبيعات..."
                            value={d.name}
                            onChange={(e) => {
                              const updated = [...draftDepts];
                              updated[i].name = e.target.value;
                              setDraftDepts(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">المدير المسؤول</label>
                          <input
                            type="text"
                            placeholder="اسم المدير المسؤول (اختياري)..."
                            value={d.managerName || ''}
                            onChange={(e) => {
                              const updated = [...draftDepts];
                              updated[i].managerName = e.target.value;
                              setDraftDepts(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">الميزانية ({currencySymbol})</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={d.monthlyBudget === 0 ? '' : d.monthlyBudget}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                                const updated = [...draftDepts];
                                updated[i].monthlyBudget = val;
                                setDraftDepts(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          {draftDepts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDraftDepts(draftDepts.filter((_, idx) => idx !== i));
                              }}
                              className="p-2 mt-4 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                              title="حذف القسم"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Benchmark & Target */}
              {editorTab === 'benchmark' && (
                <div className="space-y-5 p-2">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      سقف معدل الدوران الوظيفي المستهدف (Target Max Turnover Rate %)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={draftTargetTurnover}
                        onChange={(e) => setDraftTargetTurnover(Math.max(1, Number(e.target.value) || 10))}
                        className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-center"
                      />
                      <span className="text-xs text-slate-400 font-bold">% سنوياً</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      المعدل العالمي الموصى به للمؤسسات المستقرة يتراوح عادة بين 8% و 12% سنوياً.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={handleResetToAutoSync}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة ضبط المزامنة التلقائية</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKpiEditorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveKpiEditor}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEPARTMENT EMPLOYEE DRILLDOWN MODAL                              */}
      {/* ========================================================================= */}
      {selectedDeptForDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    موظفو {selectedDeptForDrilldown.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    المدير: {selectedDeptForDrilldown.managerName ? selectedDeptForDrilldown.managerName : 'غير محدد'} • الميزانية: {selectedDeptForDrilldown.monthlyBudget > 0 ? `${selectedDeptForDrilldown.monthlyBudget.toLocaleString()} ${currencySymbol}` : 'غير محددة'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeptForDrilldown(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter in modal */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الكود أو الوظيفة..."
                  value={drilldownSearchTerm}
                  onChange={(e) => setDrilldownSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-9 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 space-y-2 flex-1">
              {employees
                .filter(
                  (e) =>
                    e.department === selectedDeptForDrilldown.name &&
                    (e.name.toLowerCase().includes(drilldownSearchTerm.toLowerCase()) ||
                      (e.position && e.position.toLowerCase().includes(drilldownSearchTerm.toLowerCase())) ||
                      (e.employeeCode && e.employeeCode.includes(drilldownSearchTerm)))
                )
                .map((emp) => (
                  <div key={emp.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{emp.name}</h4>
                          {emp.employeeCode && (
                            <span className="text-[10px] font-mono font-bold text-slate-400">#{emp.employeeCode}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{emp.position || 'موظف'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : emp.status === 'resigned'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {emp.status === 'active' ? 'نشط' : emp.status === 'resigned' ? 'مستقيل' : 'إجازة'}
                      </span>
                    </div>
                  </div>
                ))}

              {employees.filter((e) => e.department === selectedDeptForDrilldown.name).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا يوجد موظفون مسجلون حالياً في هذا القسم.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDeptForDrilldown(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// CUSTOM RECHARTS TOOLTIPS
// -------------------------------------------------------------
function CustomTurnoverTooltip({ active, payload, label, currencySymbol }: any) {
  if (active && payload && payload.length) {
    const hires = payload.find((p: any) => p.dataKey === 'hires')?.value || 0;
    const departures = payload.find((p: any) => p.dataKey === 'departures')?.value || 0;
    const rate = payload.find((p: any) => p.dataKey === 'turnoverRate')?.value || 0;
    const net = hires - departures;
    const reason = payload[0]?.payload?.primaryReason;

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-2 min-w-[200px] text-right" dir="rtl">
        <p className="font-extrabold text-blue-400 border-b border-slate-800 pb-1.5">
          {label}
        </p>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span>تعيينات جديدة:</span>
            <span>+{hires}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400 font-bold">
            <span>استقالات وخروج:</span>
            <span>-{departures}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 font-bold pt-1 border-t border-slate-800">
            <span>صافي النمو:</span>
            <span className={net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{net > 0 ? `+${net}` : net}</span>
          </div>
          <div className="flex items-center justify-between text-blue-300 font-bold">
            <span>معدل الدوران:</span>
            <span>{rate}%</span>
          </div>
          {reason && (
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              السبب: {reason}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

function CustomDeptTooltip({ active, payload, totalHeadcount }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[190px] text-right" dir="rtl">
        <p className="font-extrabold text-indigo-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
          <span>{data.name}</span>
        </p>
        <div className="space-y-1 text-[11px] text-slate-200">
          <div className="flex items-center justify-between">
            <span>عدد الموظفين:</span>
            <span className="font-bold text-white">{data.count} موظف</span>
          </div>
          <div className="flex items-center justify-between">
            <span>النسبة من المنشأة:</span>
            <span className="font-bold text-indigo-300">{data.percentage}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>المدير المسؤول:</span>
            <span className="text-slate-300">{data.managerName}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
