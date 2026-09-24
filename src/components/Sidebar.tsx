import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calculator,
  Briefcase,
  Activity,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Database,
  FileCheck,
  LogOut,
  GraduationCap,
  Smartphone
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unresolvedAlertCount?: number;
  unresolvedAlertsCount?: number;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unresolvedAlertCount,
  unresolvedAlertsCount,
  isDarkMode,
  setIsDarkMode,
  darkMode,
  setDarkMode,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  onLogout
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
  const toggleCollapsed = () => {
    if (propSetIsCollapsed) {
      propSetIsCollapsed(!isCollapsed);
    } else {
      setInternalCollapsed(!isCollapsed);
    }
  };

  const currentDarkMode = isDarkMode ?? darkMode ?? false;
  const handleToggleDarkMode = () => {
    if (setIsDarkMode) {
      setIsDarkMode(!currentDarkMode);
    } else if (setDarkMode) {
      setDarkMode(!currentDarkMode);
    }
  };

  const alertCount = unresolvedAlertCount ?? unresolvedAlertsCount ?? 0;
  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: alertCount > 0 ? `${alertCount} تنبيه` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'employees' as TabType,
      label: 'إدارة الموظفين',
      icon: Users,
    },
    {
      id: 'employee_effects' as TabType,
      label: 'مؤثرات الموظفين',
      icon: Activity,
    },
    {
      id: 'training' as TabType,
      label: 'إدارة التدريب',
      icon: GraduationCap,
    },
    {
      id: 'attendance' as TabType,
      label: 'الحضور والانصراف',
      icon: Clock,
    },
    {
      id: 'payroll' as TabType,
      label: 'جدول المرتبات',
      icon: Calculator,
    },
    {
      id: 'loans-assets' as TabType,
      label: 'السلف والعهد',
      icon: Briefcase,
    },
    {
      id: 'ai-assistant' as TabType,
      label: 'المساعد الذكي والوظائف',
      icon: Sparkles,
      highlight: true,
    },
    {
      id: 'reports' as TabType,
      label: 'التقارير التنفيذية KPIs',
      icon: BarChart3,
    },
    {
      id: 'database' as TabType,
      label: 'قاعدة البيانات',
      icon: Database,
    },
    {
      id: 'documents' as TabType,
      label: 'الوثائق المعتمدة',
      icon: FileCheck,
    },
    {
      id: 'settings' as TabType,
      label: 'إعدادات النظام',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 border-l bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex items-center ${
          isCollapsed ? 'flex-col justify-center gap-1.5 py-3 px-1' : 'justify-between px-4'
        } h-20 border-b border-slate-100 dark:border-slate-800 transition-all`}
      >
        <div className="flex items-center gap-3 overflow-hidden justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white truncate"
              >
                Smart HR
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                نظام الموارد البشرية
              </span>
            </div>
          )}
        </div>

        <button
          id="collapse-sidebar-btn"
          onClick={toggleCollapsed}
          className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 ${
            isCollapsed ? 'mt-0.5' : ''
          }`}
          title={isCollapsed ? 'توسيع القائمة' : 'طَي القائمة'}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          ) : (
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                } ${item.highlight && !isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-right">{item.label}</span>
              )}

              {item.badge && !isCollapsed && (
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {item.badge && isCollapsed && (
                <span className="absolute top-2 left-2 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Theme & Company Card */}
      <div
        className="p-3 border-t space-y-3 border-slate-100 dark:border-slate-800"
      >
        {/* Dark Mode Switcher */}
        <button
          id="toggle-theme-sidebar-btn"
          onClick={handleToggleDarkMode}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <div className="flex items-center gap-2">
            {currentDarkMode ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            {!isCollapsed && (
              <span>{currentDarkMode ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
            )}
          </div>
          {!isCollapsed && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
            >
              {currentDarkMode ? 'مُفعّل' : 'تغير'}
            </span>
          )}
        </button>

        {/* Company Info Box */}
        {!isCollapsed && (
          <div
            className="p-3 rounded-xl border flex items-center gap-3 bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p
                className="text-xs font-bold truncate text-slate-800 dark:text-slate-200"
              >
                النظام الموحد
              </p>
              <p
                className="text-[10px] truncate text-slate-500 dark:text-slate-400"
              >
                إدارة الموارد البشرية
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          id="sidebar-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};
