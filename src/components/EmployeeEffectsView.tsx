import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  Activity, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  User,
  Clock,
  Edit3,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Employee, AttendanceRecord, PayrollRecord, Department } from '../types';

interface EmployeeEffectsViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
  departments: Department[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currencySymbol: string;
  onUpdateAttendanceRecord?: (record: AttendanceRecord) => void;
  onAddAttendanceRecord?: (record: AttendanceRecord) => void;
}

export const EmployeeEffectsView: React.FC<EmployeeEffectsViewProps> = ({
  employees,
  attendance,
  payroll,
  departments,
  searchTerm,
  setSearchTerm,
  currencySymbol,
  onUpdateAttendanceRecord,
  onAddAttendanceRecord
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [effectOverrides, setEffectOverrides] = useState<Record<string, {
    annualLeaveTotal?: number;
    casualLeaveTotal?: number;
    absences?: number;
    lates?: number;
    totalIncentives?: number;
    totalOvertime?: number;
  }>>({});
  
  const [editForm, setEditForm] = useState({
    annualLeaveTotal: 0,
    casualLeaveTotal: 0,
    absences: 0,
    lates: 0,
    totalIncentives: 0,
    totalOvertime: 0
  });
  const [showMissingAttendance, setShowMissingAttendance] = useState(false);
  const [missingMonth, setMissingMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });


  const missingRecords = useMemo(() => {
    const uniqueDates = Array.from(new Set<string>(attendance.map(a => a.date))).sort().reverse();
    const missing: { id: string, date: string, employee: Employee, existingRecord?: AttendanceRecord }[] = [];
    uniqueDates.forEach((date: string) => {
      if (!date.startsWith(missingMonth)) return;
      
      employees.forEach(emp => {
        const record = attendance.find(a => a.date === date && a.employeeId === emp.id);
        if (!record || record.status === 'absent') {
          missing.push({ id: `${date}-${emp.id}`, date, employee: emp, existingRecord: record });
        }
      });
    });
    return missing;
  }, [attendance, employees, missingMonth]);

  const handleResolveAbsence = (date: string, employee: Employee, existingRecord: AttendanceRecord | undefined, newStatus: any) => {
    if (existingRecord && onUpdateAttendanceRecord) {
      onUpdateAttendanceRecord({ ...existingRecord, status: newStatus });
    } else if (onAddAttendanceRecord) {
      onAddAttendanceRecord({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        date: date,
        checkIn: '-',
        checkOut: '-',
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        status: newStatus,
        shiftName: 'غير محدد'
      });
    }
  };
  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
      
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, selectedDept]);

  // Calculate effects for a specific employee
  const calculateEmployeeEffects = (employee: Employee) => {
    const override = effectOverrides[employee.id] || {};
    
    // Absences from attendance
    const calcAbsences = attendance.filter(a => a.employeeId === employee.id && a.status === 'absent').length;
    const calcLates = attendance.filter(a => a.employeeId === employee.id && a.status === 'late').length;
    
    const absences = override.absences ?? calcAbsences;
    const lates = override.lates ?? calcLates;
    
    // Aggregating from payroll for the current year/latest records
    const empPayroll = payroll.filter(p => p.employeeId === employee.id);
    const calcTotalIncentives = empPayroll.reduce((sum, p) => sum + (p.bonus || 0), 0);
    const calcTotalOvertime = empPayroll.reduce((sum, p) => sum + p.overtimePay + (p.fridayOvertimePay || 0), 0);
    
    const totalIncentives = override.totalIncentives ?? calcTotalIncentives;
    const totalOvertime = override.totalOvertime ?? calcTotalOvertime;
    
    // Mock leave balances (Typically 21 annual, 7 casual in standard contracts)
    // Could be dynamically calculated based on join date in a real app
    const annualLeaveTotal = override.annualLeaveTotal ?? 0;
    const casualLeaveTotal = override.casualLeaveTotal ?? 0;
    
    const consumedLeaves = attendance.filter(a => a.employeeId === employee.id && a.status === 'leave').length;
    // Simple distribution for visual sake (Assuming 80% annual, 20% casual consumed if any)
    const consumedCasual = Math.min(casualLeaveTotal, Math.floor(consumedLeaves * 0.2));
    const consumedAnnual = consumedLeaves - consumedCasual;
    
    const remainingAnnual = annualLeaveTotal - consumedAnnual;
    const remainingCasual = casualLeaveTotal - consumedCasual;

    return {
      absences,
      lates,
      totalIncentives,
      totalOvertime,
      annualLeaveTotal,
      consumedAnnual,
      remainingAnnual,
      casualLeaveTotal,
      consumedCasual,
      remainingCasual,
      totalAllowances: employee.housingAllowance + employee.transportAllowance + employee.otherAllowances
    };
  };

  const handleExportCSV = (employee: Employee) => {
    const eff = calculateEmployeeEffects(employee);
    
    const csvContent = [
      ['اسم الموظف', employee.name],
      ['الكود الوظيفي', employee.employeeCode],
      ['القسم', employee.department],
      ['المسمى الوظيفي', employee.position],
      [],
      ['البيان', 'الرصيد الكلي', 'المستهلك', 'المتبقي'],
      ['إجازة اعتيادية (سنوية)', eff.annualLeaveTotal, eff.consumedAnnual, eff.remainingAnnual],
      ['إجازة عارضة', eff.casualLeaveTotal, eff.consumedCasual, eff.remainingCasual],
      ['أيام الغياب', '-', eff.absences, '-'],
      [],
      ['البيانات المالية والمستحقات', 'الرقم'],
      ['الراتب الأساسي', employee.baseSalary],
      ['إجمالي البدلات', eff.totalAllowances],
      ['حوافز ومكافآت (حتى تاريخه)', eff.totalIncentives],
      ['أجر عمل إضافي (حتى تاريخه)', eff.totalOvertime]
    ].map(row => row.join(',')).join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `مؤثرات_${employee.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const handleEditClick = (employee: Employee) => {
    const eff = calculateEmployeeEffects(employee);
    setEditForm({
      annualLeaveTotal: eff.annualLeaveTotal,
      casualLeaveTotal: eff.casualLeaveTotal,
      absences: eff.absences,
      lates: eff.lates,
      totalIncentives: eff.totalIncentives,
      totalOvertime: eff.totalOvertime
    });
    setEditingEmployee(employee);
  };
  
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    
    setEffectOverrides(prev => ({
      ...prev,
      [editingEmployee.id]: {
        ...prev[editingEmployee.id],
        annualLeaveTotal: editForm.annualLeaveTotal,
        casualLeaveTotal: editForm.casualLeaveTotal,
        absences: editForm.absences,
        lates: editForm.lates,
        totalIncentives: editForm.totalIncentives,
        totalOvertime: editForm.totalOvertime
      }
    }));
    
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            <span>مؤثرات الموظفين</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            إدارة رصيد الإجازات، الغياب، العارضات، والمستحقات المالية (الأساسي، الحوافز، الإضافي)
          </p>
        </div>
        <button
          onClick={() => setShowMissingAttendance(true)}
          className="px-4 py-2.5 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/50 shadow-sm"
        >
          <AlertCircle className="w-5 h-5" />
          <span>تسوية الغياب (لم يسجلوا البصمة)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الموظف أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
          >
            <option value="all">جميع الأقسام</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredEmployees.map((employee, idx) => {
          const effects = calculateEmployeeEffects(employee);
          
          return (
            <div key={`eff-emp-${employee.id}-${idx}`} className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{employee.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{employee.employeeCode}</span>
                      <span>•</span>
                      <span>{employee.department}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(employee)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl transition-colors cursor-pointer"
                    title="تعديل المؤثرات"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleExportCSV(employee)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                    title="تحميل بصيغة CSV"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Leaves */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">رصيد الإجازات</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">اعتيادي (متبقي/كلي):</span>
                      <span className="font-bold text-slate-900 dark:text-white">{effects.remainingAnnual} / {effects.annualLeaveTotal}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">عارضة (متبقي/كلي):</span>
                      <span className="font-bold text-slate-900 dark:text-white">{effects.remainingCasual} / {effects.casualLeaveTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Absences */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">الغياب والتأخير</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">أيام الغياب:</span>
                      <span className={`font-bold ${effects.absences > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{effects.absences} يوم</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">مرات التأخير:</span>
                      <span className={`font-bold ${effects.lates > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{effects.lates} مرة</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 border border-blue-100 dark:border-blue-800/30">
                 <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300">المستحقات المالية المؤثرة</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-2 text-center border border-blue-100 dark:border-blue-800/50 shadow-sm">
                       <span className="block text-[10px] text-slate-500 mb-1">الأساسي</span>
                       <span className="font-bold text-xs text-slate-900 dark:text-white">{employee.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-2 text-center border border-blue-100 dark:border-blue-800/50 shadow-sm">
                       <span className="block text-[10px] text-slate-500 mb-1">البدلات (ثابت)</span>
                       <span className="font-bold text-xs text-slate-900 dark:text-white">{effects.totalAllowances.toLocaleString()}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-2 text-center border border-blue-100 dark:border-blue-800/50 shadow-sm">
                       <span className="block text-[10px] text-slate-500 mb-1">حوافز وإضافي</span>
                       <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">+{(effects.totalIncentives + effects.totalOvertime).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-12 text-center">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-slate-400" />
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium">لم يتم العثور على موظفين مطابقين للبحث</p>
          </div>
        )}
      </div>

      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-xl relative animate-fade-in border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-indigo-600" />
                <span>تعديل مؤثرات الموظف</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{editingEmployee.name}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{editingEmployee.employeeCode} - {editingEmployee.department}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">إجمالي الإجازات الاعتيادية</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.annualLeaveTotal || ''}
                    onChange={(e) => setEditForm({...editForm, annualLeaveTotal: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">إجمالي الإجازات العارضة</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.casualLeaveTotal || ''}
                    onChange={(e) => setEditForm({...editForm, casualLeaveTotal: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">أيام الغياب</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.absences || ''}
                    onChange={(e) => setEditForm({...editForm, absences: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">مرات التأخير</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.lates || ''}
                    onChange={(e) => setEditForm({...editForm, lates: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">إجمالي الحوافز ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalIncentives || ''}
                    onChange={(e) => setEditForm({...editForm, totalIncentives: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">إجمالي الإضافي ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalOvertime || ''}
                    onChange={(e) => setEditForm({...editForm, totalOvertime: e.target.value === '' ? 0 : parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Missing Attendance Modal */}
      {showMissingAttendance && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-xl relative animate-fade-in border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                  <span>الموظفين الذين لم يسجلوا البصمة (الغياب)</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">حدد موقف الغياب (إجازة، عارضة، مرضي، مأمورية) ليتم تسويته</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMissingAttendance(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-bold text-sm">اختر الشهر:</span>
              <input 
                type="month" 
                value={missingMonth}
                onChange={(e) => setMissingMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto grow border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                  <tr>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">التاريخ</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">اسم الموظف</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">القسم</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">الحالة الحالية</th>
                    <th className="p-4 border-b border-slate-200 dark:border-slate-700">تسوية الموقف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {missingRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        لا يوجد موظفين مسجلين غياب في هذا الشهر.
                      </td>
                    </tr>
                  ) : (
                    missingRecords.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-4 font-bold">{record.date}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{record.employee.name}</td>
                        <td className="p-4 text-slate-500">{record.employee.department}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                            {record.existingRecord?.status === 'absent' ? 'مسجل غياب' : 'لم يسجل بصمة'}
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={record.existingRecord?.status || 'absent'}
                            onChange={(e) => handleResolveAbsence(record.date, record.employee, record.existingRecord, e.target.value)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="absent">تأكيد الغياب</option>
                            <option value="annual_leave">إجازة اعتيادية</option>
                            <option value="casual_leave">إجازة عارضة</option>
                            <option value="sick_leave">إجازة مرضية</option>
                            <option value="mission">مأمورية عمل</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
