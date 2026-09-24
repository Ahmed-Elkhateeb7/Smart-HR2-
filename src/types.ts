export type TabType =
  | 'dashboard'
  | 'employees'
  | 'training'
  | 'attendance'
  | 'payroll'
  | 'loans-assets'
  | 'ai-assistant'
  | 'reports'
  | 'settings'
  | 'database'
  | 'documents'
  | 'employee_effects'
  | 'mobile-attendance';

export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'resigned';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  avatar: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  gosiInsurance: number; // Insurance deduction
  iqamaOrIdNumber: string;
  iqamaExpiryDate: string; // YYYY-MM-DD
  contractType: string;
  contractExpiryDate: string; // YYYY-MM-DD
  joinDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  bankAccount: string;
  bankName: string;
  // New Egyptian / HR Standard Fields
  birthDate?: string; // تاريخ الميلاد (YYYY-MM-DD)
  nationalId?: string; // الرقم القومي (14 رقم)
  insuranceNumber?: string; // الرقم التأميني
  insuranceStatus?: 'خاضع للتأمين' | 'غير خاضع' | 'معفى' | string; // التأمينات
  employeeInsuranceShare?: number; // حصة العامل (تأمينات)
  employerInsuranceShare?: number; // حصة صاحب العمل (تأمينات)
  taxAmount?: number; // الضريبة المستقطعة
  militaryStatus?: 'أدى الخدمة' | 'معفى نهائي' | 'معفى مؤقت' | 'غير مطلوب' | 'مؤجل' | string; // موقف الخدمة العسكرية
  maritalStatus?: 'أعزب' | 'متزوج' | 'متزوج ويعول' | 'مطلق' | 'أرمل' | string; // الحالة الاجتماعية
  address?: string; // العنوان
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'early_leave' | 'sick_leave' | 'casual_leave' | 'annual_leave' | 'mission' | 'work_injury';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM
  checkOut: string; // HH:MM
  delayMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  shiftName: string;
  notes?: string;
  // GPS & Mobile Geofence tracking fields
  userLat?: number;
  userLng?: number;
  distanceMeters?: number;
  geofenceStatus?: 'in_range' | 'out_of_range';
  verificationMethod?: 'gps_mobile' | 'biometric' | 'manual' | 'system';
  mobileDeviceName?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkInDistance?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutDistance?: number;
}

export interface Shift {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'flexible' | 'night';
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "16:00"
  gracePeriodMinutes: number;
  workingHours: number;
  activeDays: string[]; // e.g. ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  position: string;
  department: string;
  month: string; // e.g. "2026-07"
  baseSalary: number;
  allowances: number;
  otherAllowances?: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  overtimeHoursDay?: number;
  overtimeHoursNight?: number;
  overtimeRateDay?: number;
  overtimeRateNight?: number;
  fridayOvertimeHours?: number;
  fridayOvertimeRate?: number;
  fridayOvertimePay?: number;
  bonus?: number;
  deductions: number;
  latePenaltyDeduction: number;
  loanInstallment: number;
  socialInsurance: number;
  netSalary: number;
  status: 'draft' | 'approved';
  approvalDate?: string;
  approvedBy?: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  monthlyInstallment: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending';
  notes?: string;
}

export interface Asset {
  id: string;
  assetName: string;
  assetCode: string;
  category: string;
  serialNumber: string;
  assignedToEmployeeId?: string;
  assignedToName?: string;
  assignedDate?: string;
  condition: 'جديد' | 'ممتاز' | 'جيد' | 'يحتاج صيانة';
  status: 'مع موظف' | 'المخزن' | 'صيانة';
  value: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  severity: 'danger' | 'warning' | 'info';
  category: 'payroll' | 'document' | 'attendance' | 'asset';
  date: string;
  resolved: boolean;
  relatedEmployeeId?: string;
}

export interface Department {
  id: string;
  name: string;
  managerName: string;
  employeeCount: number;
  monthlyBudget: number;
  iconName?: string;
}

export interface CompanySettings {
  companyName: string;
  taxNumber: string;
  commercialRecord: string;
  overtimeRateMultiplier: number; // e.g. 1.5
  gosiEmployeePercent: number; // e.g. 9.75%
  enableSmartGuard: boolean;
  currencySymbol: string; // "ج.م"
  workDaysPerMonth: number; // e.g. 22 or 30
  logoUrl?: string; // Company logo data URL or path
  // Geofence & Mobile Attendance Settings
  companyLat?: number; // خط العرض لمقر الشركة
  companyLng?: number; // خط الطول لمقر الشركة
  allowedRadiusMeters?: number; // نصف القطر المسموح به بالمتر (الافتراضي 50 متراً)
  companyAddress?: string; // عنوان أو اسم مقر الشركة
  enableGeofenceAttendance?: boolean; // تفعيل ميزة حضور الموبايل بالموقع الجغرافي
  allowOutsideGeofenceWithWarning?: boolean; // السماح بالتسجيل خارج النطاق مع إشعار تحذيري
}

export interface MobilePunchPayload {
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  punchType: 'check_in' | 'check_out';
  userLat: number;
  userLng: number;
  accuracyMeters?: number;
  notes?: string;
  deviceInfo?: string;
}

export interface MobilePunchResult {
  success: boolean;
  inRange: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  punchType: 'check_in' | 'check_out';
  timestamp: string;
  timeStr: string;
  dateStr: string;
  message: string;
  record?: AttendanceRecord;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'قانوني' | 'إداري' | 'مالي' | 'موارد بشرية' | 'أخرى';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  status: 'معتمد' | 'قيد المراجعة' | 'مؤرشف';
  description?: string;
  fileUrl?: string;
}

export interface MonthlyTurnoverRecord {
  monthKey: string; // e.g. "01", "02" ... "12"
  monthName: string; // e.g. "يناير"
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  hires: number;
  departures: number; // Resignations or terminations
  activeCount: number;
  turnoverRate?: number; // percentage
  primaryReason?: string;
  notes?: string;
}

export interface KpiSettings {
  targetMaxTurnoverRate: number; // e.g. 10%
  selectedYear: number;
  customTurnoverData?: Record<string, MonthlyTurnoverRecord>;
  customDeptQuotas?: Record<string, number>;
}

export type TrainingType = 'internal' | 'external' | 'online';
export type CourseStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type NominationStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceGrade = 'present' | 'absent' | 'completed';

export interface TrainingCourse {
  id: string;
  code: string; // e.g. "TRN-101"
  title: string;
  description: string;
  instructor: string;
  targetRole: string; // الوصف / المسمى الوظيفي المستهدف
  department?: string; // القسم المستهدف أو "كافة الأقسام"
  type: TrainingType; // 'internal' | 'external' | 'online'
  status: CourseStatus; // 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  maxParticipants: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationHours: number;
  locationOrLink?: string; // مكان التدريب أو رابط المنصة
  costPerParticipant?: number;
  objectives?: string[];
  createdDate: string;
}

export interface TrainingNomination {
  id: string;
  courseId: string;
  courseTitle: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  department: string;
  position: string;
  nominatedBy: string; // جهة / شخص الترشيح (مثلاً: مدير القسم أو الموارد البشرية)
  nominationDate: string; // YYYY-MM-DD
  status: NominationStatus; // 'pending' | 'approved' | 'rejected'
  rejectionReason?: string;
  // Attendance & Evaluation tracking
  attendanceRate: number; // 0 - 100%
  attendanceStatus: AttendanceGrade; // 'present' | 'absent' | 'completed'
  completedDate?: string;
  // Post-course evaluation
  employeeScore?: number; // 1-5 rating (مستوى الاستفادة)
  instructorRating?: number; // 1-5 rating (تقييم المدرب)
  courseContentRating?: number; // 1-5 rating (تقييم المحتوى)
  evaluationNotes?: string; // ملاحظات وتوصيات التقييم
  passed?: boolean; // هل اجتاز الدورة
  certificateIssued?: boolean;
}

export type BiometricDeviceType =
  | 'fingerprint'
  | 'face'
  | 'rfid'
  | 'palm'
  | 'hybrid';

export type BiometricConnectionStatus = 'online' | 'offline' | 'syncing' | 'error' | 'untested';

export interface BiometricDevice {
  id: string;
  name: string; // e.g. "جهاز بصمة البوابة الرئيسية"
  deviceName?: string; // alias for name
  model: string; // e.g. "ZKTeco K40", "Hikvision DS-K1T804", "Dahua ASI7213X", "Suprema BioStation"
  deviceType: BiometricDeviceType | string; // نوع الجهاز: بصمة إصبع / بصمة وجه / كارت / بصمة كف / مدمج
  ip: string; // عنوان الـ IP الخاص بالجهاز
  port: number; // رقم البورت (مثلاً 4370 أو 80 أو 5005)
  username: string; // اسم المستخدم
  password?: string; // كلمة المرور أو مفتاح الاتصال ComKey
  location?: string; // موقع الجهاز أو الفرع
  status: BiometricConnectionStatus;
  autoSyncEnabled: boolean; // تفعيل المزامنة اليومية التلقائية
  autoSyncTime: string; // وقت المزامنة التلقائية (مثلاً "23:59")
  syncFrequency?: 'daily' | 'hourly' | 'every_30_min' | 'every_6_hours'; // تكرار المزامنة
  lastSyncTime?: string; // آخر موعد مزامنة ناجحة
  lastSyncLogsCount?: number; // عدد السجلات المسحوبة في آخر مزامنة
  totalPunchesStored?: number; // إجمالي السجلات المخزنة
  enrolledUsersCount?: number; // عدد الموظفين المسجلين بالجهاز
  firmwareVersion?: string; // إصدار النظام بالجهاز
  serialNumber?: string; // الرقم التسلسلي للجهاز
  notes?: string;
}

export interface BiometricPunchLog {
  id: string;
  deviceId: string;
  deviceName: string;
  employeeCode: string;
  employeeName: string;
  timestamp: string; // YYYY-MM-DD HH:MM:SS
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  punchType: 'check_in' | 'check_out' | 'break_out' | 'break_in' | 'auto';
  verifyType: 'fingerprint' | 'face' | 'card' | 'password';
  status: 'processed' | 'duplicate' | 'pending';
  rawLine?: string;
}

export interface BiometricSyncSettings {
  autoDailySync: boolean;
  dailySyncTime: string; // e.g. "23:59"
  syncFrequency?: 'daily' | 'hourly' | 'every_30_min' | 'every_6_hours';
  syncIntervalMinutes?: number;
  autoRegisterNewEmployees?: boolean;
  autoCreateEmployees?: boolean;
  autoCalculateShifts?: boolean;
  matchBy?: string;
  debounceMinutes?: number;
  lastGlobalSync?: string;
}

