import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  ShieldAlert,
  UserCheck,
  Calendar,
  CheckCircle2,
  X,
  ExternalLink,
  Menu,
  Users,
  Briefcase,
  Calculator,
  Clock,
  FileText,
  DollarSign,
  LayoutDashboard,
  Activity,
  BarChart3,
  Database,
  Settings,
  ChevronLeft,
  ArrowUpRight,
  Filter,
  Check,
  Laptop,
  GraduationCap
} from 'lucide-react';
import {
  SystemAlert,
  TabType,
  Employee,
  Asset,
  Loan,
  DocumentItem,
  PayrollRecord,
  AttendanceRecord,
  Department
} from '../types';

interface HeaderProps {
  alerts: SystemAlert[];
  onResolveAlert: (id: string) => void;
  activeTab?: TabType;
  setActiveTab: (tab: TabType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  todayAttendanceCount?: number;
  totalEmployeesCount?: number;
  employees?: Employee[];
  departments?: Department[];
  assets?: Asset[];
  loans?: Loan[];
  documents?: DocumentItem[];
  payrollRecords?: PayrollRecord[];
  attendanceRecords?: AttendanceRecord[];
  currencySymbol?: string;
}

type SearchCategory = 'all' | 'employees' | 'assets' | 'loans' | 'payroll' | 'documents' | 'attendance' | 'pages';

export const Header: React.FC<HeaderProps> = ({
  alerts,
  onResolveAlert,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  todayAttendanceCount = 18,
  totalEmployeesCount = 24,
  employees = [],
  departments = [],
  assets = [],
  loans = [],
  documents = [],
  payrollRecords = [],
  attendanceRecords = [],
  currencySymbol = 'ج.م'
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<SearchCategory>('all');
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  const currentDateArabic = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Global shortcut (Ctrl+K / Cmd+K or /) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System navigation sections
  const systemPages = useMemo(() => [
    { id: 'dashboard' as TabType, title: 'لوحة التحكم', desc: 'الإحصائيات ونظرة عامة على المؤسسة', icon: LayoutDashboard, keywords: 'رئيسية إحصائيات لوحة مؤشرات قياس' },
    { id: 'employees' as TabType, title: 'إدارة الموظفين', desc: 'قائمة الموظفين، الملفات الشخصية، والعقود', icon: Users, keywords: 'موظف موظفين عمال إضافة تعيين عقود قسم وظيفة' },
    { id: 'employee_effects' as TabType, title: 'مؤثرات الموظفين', desc: 'المكافآت، الخصومات، والبدلات الإضافية', icon: Activity, keywords: 'مؤثرات جزاءات غياب خصم مكافأة حافز إضافي' },
    { id: 'training' as TabType, title: 'إدارة التدريب', desc: 'الدورات التدريبية، ترشيح الموظفين، الحضور والتقييمات والشهادات', icon: GraduationCap, keywords: 'تدريب دورات دورة كورس ترشيح موظف تقييم حضور شهادة مدرب ساعات تدريبية تطوير' },
    { id: 'attendance' as TabType, title: 'الحضور والانصراف', desc: 'سجلات البصمة اليومية والورديات والتأخير', icon: Clock, keywords: 'حضور انصراف بصمة وقت تأخير وردية دوام' },
    { id: 'payroll' as TabType, title: 'جدول المرتبات', desc: 'مسيرات الأجور والرواتب والضرائب والتأمينات', icon: Calculator, keywords: 'راتب رواتب مرتبات أجور مفردات مسير صافي استحقاقات' },
    { id: 'loans-assets' as TabType, title: 'السلف والعهد', desc: 'تتبع السلف المالية والأجهزة والمعدات المستلمة', icon: Briefcase, keywords: 'سلفة سلف قروض عهدة أصل لابتوب سيارة هاتف تسليم' },
    { id: 'ai-assistant' as TabType, title: 'المساعد الذكي', desc: 'توليد التوصيف الوظيفي ومؤشرات الأداء AI', icon: Sparkles, keywords: 'ذكاء اصطناعي مساعد توليد وظيفة توصيف kpi مقابلة' },
    { id: 'reports' as TabType, title: 'التقارير التنفيذية KPIs', desc: 'مؤشرات الأداء الرئيسية، معدل الدوران، وتوزيع الأقسام', icon: BarChart3, keywords: 'تقرير تقارير تصدير طباعة إحصاء بياني kpi دوران وظيفي أقسام' },
    { id: 'database' as TabType, title: 'قاعدة البيانات', desc: 'إدارة البيانات، النسخ الاحتياطي والاستعادة', icon: Database, keywords: 'قاعدة بيانات نسخ احتياطي تصدير استيراد حفظ تصفير' },
    { id: 'documents' as TabType, title: 'الوثائق المعتمدة', desc: 'أرشيف المستندات والشهادات والعقود الرسمية', icon: FileText, keywords: 'مستند وثيقة عقد شهادة هوية ملف بي دي اف pdf' },
    { id: 'settings' as TabType, title: 'إعدادات النظام', desc: 'بيانات المنشأة، الضرائب، والتأمينات', icon: Settings, keywords: 'إعدادات ضبط شركة ضرائب تأمينات نظام عملة' },
  ], []);

  // Compute live search matches
  const term = searchTerm.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!term) {
      return {
        employees: [],
        assets: [],
        loans: [],
        payroll: [],
        documents: [],
        attendance: [],
        pages: [],
        total: 0
      };
    }

    const matchedEmployees = employees.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(term) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(term)) ||
        (emp.position && emp.position.toLowerCase().includes(term)) ||
        (emp.department && emp.department.toLowerCase().includes(term)) ||
        (emp.phone && emp.phone.includes(term)) ||
        (emp.iqamaOrIdNumber && emp.iqamaOrIdNumber.includes(term))
      );
    });

    const matchedAssets = assets.filter((ast) => {
      return (
        ast.assetName.toLowerCase().includes(term) ||
        ast.assetCode.toLowerCase().includes(term) ||
        (ast.serialNumber && ast.serialNumber.toLowerCase().includes(term)) ||
        (ast.category && ast.category.toLowerCase().includes(term)) ||
        (ast.assignedToName && ast.assignedToName.toLowerCase().includes(term))
      );
    });

    const matchedLoans = loans.filter((ln) => {
      return (
        ln.employeeName.toLowerCase().includes(term) ||
        (ln.notes && ln.notes.toLowerCase().includes(term)) ||
        String(ln.totalAmount).includes(term)
      );
    });

    const matchedPayroll = payrollRecords.filter((pr) => {
      return (
        pr.employeeName.toLowerCase().includes(term) ||
        (pr.employeeCode && pr.employeeCode.toLowerCase().includes(term)) ||
        (pr.department && pr.department.toLowerCase().includes(term)) ||
        (pr.month && pr.month.includes(term))
      );
    });

    const matchedDocuments = documents.filter((doc) => {
      return (
        doc.title.toLowerCase().includes(term) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(term)) ||
        (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(term)) ||
        (doc.type && doc.type.toLowerCase().includes(term))
      );
    });

    const matchedAttendance = attendanceRecords.filter((att) => {
      return (
        att.employeeName.toLowerCase().includes(term) ||
        (att.department && att.department.toLowerCase().includes(term)) ||
        (att.date && att.date.includes(term)) ||
        (att.shiftName && att.shiftName.toLowerCase().includes(term))
      );
    });

    const matchedPages = systemPages.filter((p) => {
      return (
        p.title.toLowerCase().includes(term) ||
        p.desc.toLowerCase().includes(term) ||
        p.keywords.toLowerCase().includes(term)
      );
    });

    const total =
      matchedEmployees.length +
      matchedAssets.length +
      matchedLoans.length +
      matchedPayroll.length +
      matchedDocuments.length +
      matchedAttendance.length +
      matchedPages.length;

    return {
      employees: matchedEmployees,
      assets: matchedAssets,
      loans: matchedLoans,
      payroll: matchedPayroll,
      documents: matchedDocuments,
      attendance: matchedAttendance,
      pages: matchedPages,
      total
    };
  }, [term, employees, assets, loans, payrollRecords, documents, attendanceRecords, systemPages]);

  const handleSelectResult = (tab: TabType, filterVal?: string) => {
    if (filterVal) {
      setSearchTerm(filterVal);
    }
    setActiveTab(tab);
    setIsSearchFocused(false);
  };

  const isDropdownVisible = isSearchFocused;

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <button
          onClick={() => {
            const sidebarBtn = document.getElementById('collapse-sidebar-btn');
            if (sidebarBtn) sidebarBtn.click();
          }}
          className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input & Spotlight Container */}
        <div ref={searchContainerRef} className="relative max-w-lg w-full">
          <div className="relative flex items-center">
            <Search className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
              isSearchFocused ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
            }`} />
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchResults.employees.length > 0) {
                    handleSelectResult('employees', searchTerm);
                  } else if (searchResults.pages.length > 0) {
                    handleSelectResult(searchResults.pages[0].id);
                  }
                }
              }}
              placeholder="ابحث عن موظف، كود، قسم، عهدة، سلفة، أو مستند..."
              className="w-full pl-16 pr-10 py-2.5 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 transition-all shadow-xs"
            />

            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  title="مسح نص البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs pointer-events-none">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>
          </div>

          {/* Interactive Search Dropdown Palette */}
          {isDropdownVisible && (
            <div className="absolute right-0 left-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] flex flex-col">
              {/* Category Filter Pills (When text is entered) */}
              {term ? (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2 overflow-x-auto text-xs">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setActiveCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        activeCategoryFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      الكل ({searchResults.total})
                    </button>

                    {searchResults.employees.length > 0 && (
                      <button
                        onClick={() => setActiveCategoryFilter('employees')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          activeCategoryFilter === 'employees'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        الموظفون ({searchResults.employees.length})
                      </button>
                    )}

                    {searchResults.assets.length > 0 && (
                      <button
                        onClick={() => setActiveCategoryFilter('assets')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          activeCategoryFilter === 'assets'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        العهد ({searchResults.assets.length})
                      </button>
                    )}

                    {searchResults.payroll.length > 0 && (
                      <button
                        onClick={() => setActiveCategoryFilter('payroll')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          activeCategoryFilter === 'payroll'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        الرواتب ({searchResults.payroll.length})
                      </button>
                    )}

                    {searchResults.documents.length > 0 && (
                      <button
                        onClick={() => setActiveCategoryFilter('documents')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          activeCategoryFilter === 'documents'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        الوثائق ({searchResults.documents.length})
                      </button>
                    )}

                    {searchResults.pages.length > 0 && (
                      <button
                        onClick={() => setActiveCategoryFilter('pages')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          activeCategoryFilter === 'pages'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        الأقسام ({searchResults.pages.length})
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                    {searchResults.total} نتيجة
                  </span>
                </div>
              ) : null}

              {/* Scrollable Results List */}
              <div className="overflow-y-auto max-h-96 p-3 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {/* When Search Input is Empty: Show Quick Navigation & Shortcuts */}
                {!term && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                      <span>الأقسام الرئيسية والوصول السريع</span>
                      <span className="text-[10px] text-blue-500 font-medium">اضغط للانتقال المباشر</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {systemPages.slice(0, 6).map((page) => {
                        const Icon = page.icon;
                        return (
                          <button
                            key={page.id}
                            onClick={() => handleSelectResult(page.id)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 border border-transparent transition-all text-right group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {page.title}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {page.desc}
                              </div>
                            </div>
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Search Hints */}
                    <div className="pt-2 px-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">أمثلة للبحث:</span>
                      <button
                        onClick={() => { setSearchTerm('أحمد'); searchInputRef.current?.focus(); }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      >
                        أحمد
                      </button>
                      <button
                        onClick={() => { setSearchTerm('لابتوب'); searchInputRef.current?.focus(); }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      >
                        لابتوب
                      </button>
                      <button
                        onClick={() => { setSearchTerm('عقد'); searchInputRef.current?.focus(); }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      >
                        عقد
                      </button>
                      <button
                        onClick={() => { setSearchTerm('مرتب'); searchInputRef.current?.focus(); }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      >
                        مرتب
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Results List When Term is Present */}
                {term && searchResults.total === 0 && (
                  <div className="py-8 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                      لا توجد نتائج مطابقة لـ "{searchTerm}"
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      جرب البحث بالاسم الكامل، الكود الوظيفي (مثل 101)، اسم القسم، أو نوع العهدة والمستند.
                    </p>
                  </div>
                )}

                {/* 1. Employees Section */}
                {term && (activeCategoryFilter === 'all' || activeCategoryFilter === 'employees') && searchResults.employees.length > 0 && (
                  <div className="space-y-2 pt-2 first:pt-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>الموظفون ({searchResults.employees.length})</span>
                      </div>
                      <button
                        onClick={() => handleSelectResult('employees', searchTerm)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>فتح إدارة الموظفين</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {searchResults.employees.slice(0, 5).map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => handleSelectResult('employees', emp.name)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-slate-700/60 border border-slate-200/70 dark:border-slate-700 transition-all text-right group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
                              {emp.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                  {emp.name}
                                </span>
                                {emp.employeeCode && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold">
                                    #{emp.employeeCode}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                                <span>{emp.position || 'موظف'}</span>
                                <span>•</span>
                                <span>{emp.department}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : emp.status === 'on_leave'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            }`}>
                              {emp.status === 'active' ? 'نشط' : emp.status === 'on_leave' ? 'إجازة' : 'متوقف'}
                            </span>
                            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Assets & Equipment Section */}
                {term && (activeCategoryFilter === 'all' || activeCategoryFilter === 'assets') && searchResults.assets.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                        <span>العهد والأصول ({searchResults.assets.length})</span>
                      </div>
                      <button
                        onClick={() => handleSelectResult('loans-assets')}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>فتح السلف والعهد</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {searchResults.assets.slice(0, 4).map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => handleSelectResult('loans-assets')}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-indigo-50/60 dark:hover:bg-slate-700/60 border border-slate-200/70 dark:border-slate-700 transition-all text-right group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {asset.assetName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                كود: <span className="font-mono text-slate-600 dark:text-slate-300">{asset.assetCode}</span>
                                {asset.assignedToName && ` • مستلمة من: ${asset.assignedToName}`}
                              </div>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                            {asset.status || 'مع موظف'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Payroll Records Section */}
                {term && (activeCategoryFilter === 'all' || activeCategoryFilter === 'payroll') && searchResults.payroll.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                      <div className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مسيرات الرواتب ({searchResults.payroll.length})</span>
                      </div>
                      <button
                        onClick={() => handleSelectResult('payroll')}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>فتح جدول المرتبات</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {searchResults.payroll.slice(0, 4).map((pay) => (
                        <button
                          key={pay.id}
                          onClick={() => handleSelectResult('payroll')}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-emerald-50/60 dark:hover:bg-slate-700/60 border border-slate-200/70 dark:border-slate-700 transition-all text-right group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Calculator className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                راتب {pay.employeeName} ({pay.month})
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                صافي الراتب: <span className="font-bold text-emerald-600 dark:text-emerald-400">{pay.netSalary.toLocaleString()} {currencySymbol}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pay.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {pay.status === 'approved' ? 'معتمد' : 'مسودة'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Documents Section */}
                {term && (activeCategoryFilter === 'all' || activeCategoryFilter === 'documents') && searchResults.documents.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>الوثائق والعقود ({searchResults.documents.length})</span>
                      </div>
                      <button
                        onClick={() => handleSelectResult('documents')}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>فتح الوثائق</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {searchResults.documents.slice(0, 4).map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectResult('documents')}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-amber-50/60 dark:hover:bg-slate-700/60 border border-slate-200/70 dark:border-slate-700 transition-all text-right group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {doc.title}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {doc.fileName} • بواسطة {doc.uploadedBy}
                              </div>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            {doc.category || 'مستند'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. System Navigation Pages */}
                {term && (activeCategoryFilter === 'all' || activeCategoryFilter === 'pages') && searchResults.pages.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                      <div className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                        <span>أقسام النظام والأدوات ({searchResults.pages.length})</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {searchResults.pages.map((page) => {
                        const Icon = page.icon;
                        return (
                          <button
                            key={page.id}
                            onClick={() => handleSelectResult(page.id)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/60 dark:border-slate-700 transition-all text-right group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {page.title}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {page.desc}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                              الانتقال
                              <ChevronLeft className="w-3 h-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Footer Action */}
              {term && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    اضغط <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 border rounded text-[10px]">Enter</kbd> لتطبيق البحث
                  </span>
                  
                  <button
                    onClick={() => handleSelectResult('employees', searchTerm)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>عرض النتائج في صفحة الموظفين</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Info: Live Attendance Status & Arabic Date */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{currentDateArabic}</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>حضور اليوم: {todayAttendanceCount} من {totalEmployeesCount}</span>
        </div>
      </div>

      {/* Right Controls: AI Assistant Shortcut, Notifications */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Quick AI Generator Button */}
        <button
          id="header-ai-quick-btn"
          onClick={() => setActiveTab('ai-assistant')}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>المساعد الذكي</span>
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs border border-slate-200/60 dark:border-slate-700 cursor-pointer"
            title="التنبيهات وحارس المرتبات"
          >
            <Bell className="w-5 h-5" />
            {unresolvedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unresolvedAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Modal Popup */}
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    تنبيهات حارس المرتبات للنظام
                  </span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold">
                  {unresolvedAlerts.length} معلقة
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto my-3 space-y-2.5">
                {unresolvedAlerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-medium">لا توجد تنبيهات معلقة. النظام يعمل بأعلى كفاءة!</p>
                  </div>
                ) : (
                  unresolvedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border text-xs relative ${
                        alert.severity === 'danger'
                          ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200'
                          : alert.severity === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200'
                          : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold">{alert.title}</span>
                        <span className="text-[10px] opacity-75">{alert.date}</span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            if (alert.category === 'payroll') setActiveTab('payroll');
                            else if (alert.category === 'document') setActiveTab('employees');
                            else if (alert.category === 'attendance') setActiveTab('attendance');
                            else setActiveTab('loans-assets');
                          }}
                          className="text-[11px] font-bold underline flex items-center gap-1 hover:opacity-80 cursor-pointer"
                        >
                          <span>معالجة المشكلة</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 font-bold text-[10px] shadow-xs hover:bg-white cursor-pointer"
                        >
                          تم الحل
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  إغلاق التنبيهات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
