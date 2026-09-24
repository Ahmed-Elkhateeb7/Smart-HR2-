import {
  Employee,
  AttendanceRecord,
  Shift,
  PayrollRecord,
  Loan,
  Asset,
  SystemAlert,
  Department,
  CompanySettings,
  TrainingCourse,
  TrainingNomination,
  BiometricDevice,
  BiometricPunchLog,
  BiometricSyncSettings
} from '../types';

export const initialDepartments: Department[] = [
  { id: 'dep-1', name: 'تكنولوجيا المعلومات', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-2', name: 'الموارد البشرية', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-3', name: 'التسويق والمبيعات', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-4', name: 'المالية والمحاسبة', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-5', name: 'التشغيل والخدمات', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-6', name: 'قسم الإدارة', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-7', name: 'قسم المخازن', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-8', name: 'قسم الجودة', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-9', name: 'قسم الحركة والنقل', managerName: '', employeeCount: 0, monthlyBudget: 0 },
  { id: 'dep-10', name: 'قسم المشتريات', managerName: '', employeeCount: 0, monthlyBudget: 0 },
];

export const initialEmployees: Employee[] = [];

export const initialShifts: Shift[] = [
  {
    id: 'sh-1',
    name: 'الوردية الصباحية الأساسية',
    type: 'morning',
    startTime: '08:00',
    endTime: '16:00',
    gracePeriodMinutes: 30,
    workingHours: 8,
    activeDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'],
  },
  {
    id: 'sh-2',
    name: 'الوردية التانية',
    type: 'evening',
    startTime: '16:00',
    endTime: '23:00',
    gracePeriodMinutes: 30,
    workingHours: 7,
    activeDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'],
  },
  {
    id: 'sh-3',
    name: 'الوردية التالتة',
    type: 'night',
    startTime: '23:00',
    endTime: '08:00',
    gracePeriodMinutes: 30,
    workingHours: 9,
    activeDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'],
  },
  {
    id: 'sh-5',
    name: 'وردية جمعة صباحية',
    type: 'morning',
    startTime: '08:00',
    endTime: '20:00',
    gracePeriodMinutes: 30,
    workingHours: 12,
    activeDays: ['الجمعة'],
  },
  {
    id: 'sh-4',
    name: 'وردية جمعة مسائية',
    type: 'night',
    startTime: '20:00',
    endTime: '08:00',
    gracePeriodMinutes: 30,
    workingHours: 12,
    activeDays: ['الجمعة'],
  },
];

export const initialAttendanceRecords: AttendanceRecord[] = [];

export const initialPayrollRecords: PayrollRecord[] = [];

export const initialLoans: Loan[] = [];

export const initialAssets: Asset[] = [];

export const initialSystemAlerts: SystemAlert[] = [];

export const initialCompanySettings: CompanySettings = {
  companyName: 'شركة جديدة',
  taxNumber: '',
  commercialRecord: '',
  overtimeRateMultiplier: 1.5,
  gosiEmployeePercent: 11,
  enableSmartGuard: true,
  currencySymbol: 'ج.م',
  workDaysPerMonth: 30,
  companyLat: 30.0444, // Default HQ Latitude (القاهرة)
  companyLng: 31.2357, // Default HQ Longitude (القاهرة)
  allowedRadiusMeters: 50, // 50m default geofence radius
  companyAddress: 'المقر الرئيسي للشركة',
  enableGeofenceAttendance: true,
  allowOutsideGeofenceWithWarning: false,
};

export const initialTrainingCourses: TrainingCourse[] = [];

export const initialTrainingNominations: TrainingNomination[] = [];

export const initialBiometricDevices: BiometricDevice[] = [];

export const initialBiometricLogs: BiometricPunchLog[] = [];

export const initialBiometricSettings: BiometricSyncSettings = {
  autoDailySync: true,
  dailySyncTime: '23:59',
  syncFrequency: 'daily',
  autoRegisterNewEmployees: true,
  autoCalculateShifts: true,
  lastGlobalSync: '2026-08-09 23:59:00',
};


