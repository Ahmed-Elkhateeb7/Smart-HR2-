import {
  Employee,
  AttendanceRecord,
  PayrollRecord,
  Loan,
  Asset,
  SystemAlert,
  Shift,
  DocumentItem,
  CompanySettings,
  Department,
  KpiSettings,
  TrainingCourse,
  TrainingNomination,
  BiometricDevice,
  BiometricPunchLog,
  BiometricSyncSettings
} from '../types';

import {
  initialEmployees,
  initialAttendanceRecords,
  initialPayrollRecords,
  initialLoans,
  initialAssets,
  initialSystemAlerts,
  initialShifts,
  initialDepartments,
  initialCompanySettings,
  initialTrainingCourses,
  initialTrainingNominations,
  initialBiometricDevices,
  initialBiometricLogs,
  initialBiometricSettings
} from '../data/initialData';

export const STORAGE_KEYS = {
  EMPLOYEES: 'hr_app_employees_v1',
  ATTENDANCE: 'hr_app_attendance_v1',
  PAYROLL: 'hr_app_payroll_v1',
  LOANS: 'hr_app_loans_v1',
  ASSETS: 'hr_app_assets_v1',
  ALERTS: 'hr_app_alerts_v1',
  SHIFTS: 'hr_app_shifts_v1',
  DOCUMENTS: 'hr_app_documents_v1',
  CURRENCY: 'hr_app_currency_v1',
  COMPANY_SETTINGS: 'hr_app_company_settings_v1',
  DEPARTMENTS: 'hr_app_departments_v1',
  KPI_SETTINGS: 'hr_app_kpi_settings_v1',
  TRAINING_COURSES: 'hr_app_training_courses_v1',
  TRAINING_NOMINATIONS: 'hr_app_training_nominations_v1',
  BIOMETRIC_DEVICES: 'hr_app_biometric_devices_v2',
  BIOMETRIC_LOGS: 'hr_app_biometric_logs_v2',
  BIOMETRIC_SETTINGS: 'hr_app_biometric_settings_v1',
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.error(`Error loading key ${key} from localStorage:`, error);
    return fallback;
  }
}

// Save helper
function safeSave(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving key ${key} to localStorage:`, error);
  }
}

// Deduplicate and clean employee records helper
function deduplicateEmployees(emps: Employee[]): Employee[] {
  if (!Array.isArray(emps)) return [];
  const map = new Map<string, Employee>();
  emps.forEach((emp) => {
    if (!emp) return;
    const cleanId = (emp.id || '').replace(/[\uFFFD\?]/g, '').trim();
    const cleanCode = (emp.employeeCode || '').replace(/[\uFFFD\?]/g, '').trim();
    const key = cleanId || cleanCode;
    if (key && !map.has(key)) {
      // Clean dummy test data
      const cleanedEmp: Employee = {
        ...emp,
        phone: emp.phone === '0500000000' ? '' : (emp.phone || ''),
        email: (emp.email && /^emp.*@company\.com$/.test(emp.email)) ? '' : (emp.email || ''),
        iqamaExpiryDate: emp.iqamaExpiryDate === '2028-12-31' ? '' : (emp.iqamaExpiryDate || ''),
        contractExpiryDate: emp.contractExpiryDate === '2028-12-31' ? '' : (emp.contractExpiryDate || ''),
      };
      map.set(key, cleanedEmp);
    }
  });
  return Array.from(map.values());
}

const DUMMY_MANAGERS = new Set([
  'م. أحمد علي', 'أ. سارة محمود', 'أ. كريم حسن', 'أ. طارق عبدالفتاح',
  'م. خالد مصطفى', 'د. محمد إبراهيم', 'أ. محمود سامي', 'م. ياسمين نبيل',
  'أ. حسن السيد', 'أ. عمر الخولي', 'مدير القسم'
]);

function cleanDepartments(depts: Department[]): Department[] {
  if (!Array.isArray(depts)) return initialDepartments;
  return depts.map((d) => {
    const isDummy = d.managerName && DUMMY_MANAGERS.has(d.managerName.trim());
    return {
      ...d,
      managerName: isDummy ? '' : (d.managerName || ''),
      monthlyBudget: isDummy && [150000, 80000, 120000, 95000, 70000, 200000, 65000, 75000, 85000, 90000, 50000].includes(d.monthlyBudget)
        ? 0
        : (d.monthlyBudget || 0),
    };
  });
}

const DUMMY_COURSE_IDS = new Set(['trn-c-1', 'trn-c-2', 'trn-c-3']);
const DUMMY_NOMINATION_IDS = new Set(['trn-nom-1', 'trn-nom-2', 'trn-nom-3']);

function cleanTrainingCourses(courses: TrainingCourse[]): TrainingCourse[] {
  if (!Array.isArray(courses)) return [];
  return courses.filter((c) => c && !DUMMY_COURSE_IDS.has(c.id));
}

function cleanTrainingNominations(nominations: TrainingNomination[]): TrainingNomination[] {
  if (!Array.isArray(nominations)) return [];
  return nominations.filter(
    (n) => n && !DUMMY_NOMINATION_IDS.has(n.id) && !DUMMY_COURSE_IDS.has(n.courseId)
  );
}

// Load all initial state
export function loadAllState() {
  const loadedEmps = safeParse<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  const loadedDepts = safeParse<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
  const loadedCourses = safeParse<TrainingCourse[]>(STORAGE_KEYS.TRAINING_COURSES, initialTrainingCourses);
  const loadedNominations = safeParse<TrainingNomination[]>(STORAGE_KEYS.TRAINING_NOMINATIONS, initialTrainingNominations);

  const cleanedCourses = cleanTrainingCourses(loadedCourses);
  const cleanedNominations = cleanTrainingNominations(loadedNominations);

  // If dummy items were removed, sync to localStorage
  if (loadedCourses.length !== cleanedCourses.length) {
    safeSave(STORAGE_KEYS.TRAINING_COURSES, cleanedCourses);
  }
  if (loadedNominations.length !== cleanedNominations.length) {
    safeSave(STORAGE_KEYS.TRAINING_NOMINATIONS, cleanedNominations);
  }

  return {
    employees: deduplicateEmployees(loadedEmps),
    attendanceRecords: safeParse<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords),
    payrollRecords: safeParse<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, initialPayrollRecords),
    loans: safeParse<Loan[]>(STORAGE_KEYS.LOANS, initialLoans),
    assets: safeParse<Asset[]>(STORAGE_KEYS.ASSETS, initialAssets),
    alerts: safeParse<SystemAlert[]>(STORAGE_KEYS.ALERTS, initialSystemAlerts),
    shifts: safeParse<Shift[]>(STORAGE_KEYS.SHIFTS, initialShifts),
    documents: safeParse<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, []),
    currencySymbol: safeParse<string>(STORAGE_KEYS.CURRENCY, initialCompanySettings.currencySymbol),
    companySettings: safeParse<CompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, initialCompanySettings),
    departments: cleanDepartments(loadedDepts),
    kpiSettings: safeParse<KpiSettings | null>(STORAGE_KEYS.KPI_SETTINGS, null),
    trainingCourses: cleanedCourses,
    trainingNominations: cleanedNominations,
    biometricDevices: (() => {
      const devs = safeParse<BiometricDevice[]>(STORAGE_KEYS.BIOMETRIC_DEVICES, []);
      if (!Array.isArray(devs)) return [];
      const cleaned = devs.filter((d) => d && d.id !== 'bio-dev-x628');
      if (cleaned.length !== devs.length) {
        safeSave(STORAGE_KEYS.BIOMETRIC_DEVICES, cleaned);
      }
      return cleaned;
    })(),
    biometricLogs: safeParse<BiometricPunchLog[]>(STORAGE_KEYS.BIOMETRIC_LOGS, initialBiometricLogs),
    biometricSettings: safeParse<BiometricSyncSettings>(STORAGE_KEYS.BIOMETRIC_SETTINGS, initialBiometricSettings),
  };
}

// Save state functions
export function saveEmployees(employees: Employee[]) {
  safeSave(STORAGE_KEYS.EMPLOYEES, employees);
}

export function saveDepartments(departments: Department[]) {
  safeSave(STORAGE_KEYS.DEPARTMENTS, departments);
}

export function saveKpiSettings(settings: KpiSettings) {
  safeSave(STORAGE_KEYS.KPI_SETTINGS, settings);
}

export function saveAttendanceRecords(records: AttendanceRecord[]) {
  safeSave(STORAGE_KEYS.ATTENDANCE, records);
}

export function loadAttendanceRecords(): AttendanceRecord[] {
  return safeParse<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
}

export function savePayrollRecords(records: PayrollRecord[]) {
  safeSave(STORAGE_KEYS.PAYROLL, records);
}

export function saveLoans(loans: Loan[]) {
  safeSave(STORAGE_KEYS.LOANS, loans);
}

export function saveAssets(assets: Asset[]) {
  safeSave(STORAGE_KEYS.ASSETS, assets);
}

export function saveAlerts(alerts: SystemAlert[]) {
  safeSave(STORAGE_KEYS.ALERTS, alerts);
}

export function saveShifts(shifts: Shift[]) {
  safeSave(STORAGE_KEYS.SHIFTS, shifts);
}

export function saveDocuments(documents: DocumentItem[]) {
  safeSave(STORAGE_KEYS.DOCUMENTS, documents);
}

export function saveCurrencySymbol(currencySymbol: string) {
  safeSave(STORAGE_KEYS.CURRENCY, currencySymbol);
}

export function saveCompanySettings(settings: CompanySettings) {
  safeSave(STORAGE_KEYS.COMPANY_SETTINGS, settings);
}

export function saveTrainingCourses(courses: TrainingCourse[]) {
  safeSave(STORAGE_KEYS.TRAINING_COURSES, courses);
}

export function saveTrainingNominations(nominations: TrainingNomination[]) {
  safeSave(STORAGE_KEYS.TRAINING_NOMINATIONS, nominations);
}

export function saveBiometricDevices(devices: BiometricDevice[]) {
  safeSave(STORAGE_KEYS.BIOMETRIC_DEVICES, devices);
}

export function saveBiometricLogs(logs: BiometricPunchLog[]) {
  safeSave(STORAGE_KEYS.BIOMETRIC_LOGS, logs);
}

export function saveBiometricSettings(settings: BiometricSyncSettings) {
  safeSave(STORAGE_KEYS.BIOMETRIC_SETTINGS, settings);
}

// Calculate storage size in MB
export function calculateStorageSizeMB(): number {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key) || '';
      totalBytes += (key.length + val.length) * 2; // UTF-16 bytes approx
    }
  }
  const sizeMB = totalBytes / (1024 * 1024);
  return Number(sizeMB.toFixed(3));
}

export interface BackupDataFormat {
  version: string;
  timestamp: string;
  appName: string;
  data: {
    employees?: Employee[];
    attendanceRecords?: AttendanceRecord[];
    payrollRecords?: PayrollRecord[];
    loans?: Loan[];
    assets?: Asset[];
    alerts?: SystemAlert[];
    shifts?: Shift[];
    documents?: DocumentItem[];
    currencySymbol?: string;
    trainingCourses?: TrainingCourse[];
    trainingNominations?: TrainingNomination[];
  };
}

// Create complete backup payload
export function createBackupPayload(state: {
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
}): BackupDataFormat {
  return {
    version: 'HR-SYSTEM-DATABASE-v2.0',
    timestamp: new Date().toISOString(),
    appName: 'نظام الموارد البشرية المتكامل',
    data: {
      employees: state.employees,
      attendanceRecords: state.attendanceRecords,
      payrollRecords: state.payrollRecords,
      loans: state.loans,
      assets: state.assets,
      alerts: state.alerts,
      shifts: state.shifts,
      documents: state.documents,
      currencySymbol: state.currencySymbol,
      trainingCourses: state.trainingCourses,
      trainingNominations: state.trainingNominations,
    }
  };
}

// Restore state from JSON content
export function parseAndRestoreBackup(jsonString: string): {
  success: boolean;
  message: string;
  restoredData?: {
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
  };
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both direct data wrapper and root payload formats
    let rawData: any = parsed.data || parsed;

    if (!rawData || typeof rawData !== 'object') {
      return { success: false, message: 'ملف غير صالح: لا يحتوي على تنسيق بيانات متاح.' };
    }

    const employees = Array.isArray(rawData.employees) ? rawData.employees : (Array.isArray(parsed.employees) ? parsed.employees : undefined);
    const attendanceRecords = Array.isArray(rawData.attendanceRecords) ? rawData.attendanceRecords : (Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : undefined);
    const payrollRecords = Array.isArray(rawData.payrollRecords) ? rawData.payrollRecords : (Array.isArray(parsed.payrollRecords) ? parsed.payrollRecords : undefined);
    const loans = Array.isArray(rawData.loans) ? rawData.loans : (Array.isArray(parsed.loans) ? parsed.loans : undefined);
    const assets = Array.isArray(rawData.assets) ? rawData.assets : (Array.isArray(parsed.assets) ? parsed.assets : undefined);
    const alerts = Array.isArray(rawData.alerts) ? rawData.alerts : (Array.isArray(parsed.alerts) ? parsed.alerts : undefined);
    const shifts = Array.isArray(rawData.shifts) ? rawData.shifts : (Array.isArray(parsed.shifts) ? parsed.parsedShifts : undefined);
    const documents = Array.isArray(rawData.documents) ? rawData.documents : (Array.isArray(parsed.documents) ? parsed.documents : undefined);
    const currencySymbol = typeof rawData.currencySymbol === 'string' ? rawData.currencySymbol : (typeof parsed.currencySymbol === 'string' ? parsed.currencySymbol : undefined);
    const trainingCourses = Array.isArray(rawData.trainingCourses) ? rawData.trainingCourses : (Array.isArray(parsed.trainingCourses) ? parsed.trainingCourses : undefined);
    const trainingNominations = Array.isArray(rawData.trainingNominations) ? rawData.trainingNominations : (Array.isArray(parsed.trainingNominations) ? parsed.trainingNominations : undefined);

    // If none of the main tables exist
    if (!employees && !attendanceRecords && !payrollRecords && !loans && !assets && !trainingCourses) {
      return {
        success: false,
        message: 'عذراً، الملف المرفق لا يحتوي على الجداول الرئيسية للنظام (الموظفين، المرتبات، الحضور...).'
      };
    }

    // Load current state as base
    const current = loadAllState();

    const restored = {
      employees: employees || current.employees,
      attendanceRecords: attendanceRecords || current.attendanceRecords,
      payrollRecords: payrollRecords || current.payrollRecords,
      loans: loans || current.loans,
      assets: assets || current.assets,
      alerts: alerts || current.alerts,
      shifts: shifts || current.shifts,
      documents: documents || current.documents,
      currencySymbol: currencySymbol || current.currencySymbol,
      trainingCourses: trainingCourses || current.trainingCourses,
      trainingNominations: trainingNominations || current.trainingNominations,
    };

    // Save to localStorage immediately
    saveEmployees(restored.employees);
    saveAttendanceRecords(restored.attendanceRecords);
    savePayrollRecords(restored.payrollRecords);
    saveLoans(restored.loans);
    saveAssets(restored.assets);
    saveAlerts(restored.alerts);
    saveShifts(restored.shifts);
    saveDocuments(restored.documents);
    saveCurrencySymbol(restored.currencySymbol);
    if (restored.trainingCourses) saveTrainingCourses(restored.trainingCourses);
    if (restored.trainingNominations) saveTrainingNominations(restored.trainingNominations);

    const counts = [
      restored.employees ? `${restored.employees.length} موظف` : null,
      restored.payrollRecords ? `${restored.payrollRecords.length} سجل مرتبات` : null,
      restored.attendanceRecords ? `${restored.attendanceRecords.length} سجل حضور` : null,
      restored.loans ? `${restored.loans.length} سلفة` : null,
      restored.assets ? `${restored.assets.length} أصل/عهدة` : null,
      restored.trainingCourses ? `${restored.trainingCourses.length} دورة تدريبية` : null,
    ].filter(Boolean).join('، ');

    return {
      success: true,
      message: `تم استعادة قاعدة البيانات بنجاح! (${counts})`,
      restoredData: restored
    };
  } catch (err: any) {
    return {
      success: false,
      message: `فشل قراءة الملف. تأكد من أن الملف بصيغة JSON صحيحة. (${err?.message || 'خطأ غير معروف'})`
    };
  }
}

// Clear storage
export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
