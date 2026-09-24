import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Building2,
  RefreshCw,
  LogOut,
  LogIn,
  Search,
  Check,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  Smartphone,
  ExternalLink,
  ArrowRight,
  Lock
} from 'lucide-react';
import {
  Employee,
  CompanySettings,
  Shift,
  AttendanceRecord,
  MobilePunchPayload,
  MobilePunchResult
} from '../../types';
import {
  calculateHaversineDistance,
  formatDistanceArabic,
  getCurrentUserLocation,
  GpsLocationResult,
  validateAndProcessPunch
} from '../../utils/geofence';
import { getTodayDateString, fixAttendanceRecord } from '../AttendanceView';

interface MobileAttendanceViewProps {
  employees: Employee[];
  companySettings: CompanySettings;
  shifts: Shift[];
  attendanceRecords: AttendanceRecord[];
  onAddAttendanceRecord?: (rec: AttendanceRecord) => void;
  onUpdateAttendanceRecord?: (rec: AttendanceRecord) => void;
  onRecordPunch?: (rec: AttendanceRecord) => void;
  onBackToDashboard?: () => void;
  isStandalone?: boolean;
  isKiosk?: boolean;
  onLogout?: () => void;
}

export const MobileAttendanceView: React.FC<MobileAttendanceViewProps> = ({
  employees,
  companySettings,
  shifts,
  attendanceRecords,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  onRecordPunch,
  onBackToDashboard,
  isStandalone = false,
  isKiosk = false,
  onLogout,
}) => {
  // Saved employee on device
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (isKiosk) {
      const locked = localStorage.getItem('kiosk_locked_emp_id');
      if (locked && employees.some(e => e.id === locked)) {
        return locked;
      }
    }
    return localStorage.getItem('last_mobile_emp_id') || (employees[0]?.id || '');
  });

  const [isEmpLocked, setIsEmpLocked] = useState<boolean>(() => {
    if (isKiosk) {
      const locked = localStorage.getItem('kiosk_locked_emp_id');
      return !!locked && employees.some(e => e.id === locked);
    }
    return false;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showEmpSelector, setShowEmpSelector] = useState(() => {
    // Show employee selector automatically if in kiosk mode and no employee is locked yet
    return isKiosk && !isEmpLocked;
  });

  // GPS State
  const [gpsLocation, setGpsLocation] = useState<GpsLocationResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastLocateTime, setLastLocateTime] = useState<string | null>(null);

  // Punch processing state
  const [isPunching, setIsPunching] = useState(false);
  const [punchResult, setPunchResult] = useState<MobilePunchResult | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Admin unlock modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');

  // Admin unlock handler for kiosk employee change
  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === '1001') {
      setIsEmpLocked(false);
      localStorage.removeItem('kiosk_locked_emp_id');
      setShowEmpSelector(true);
      setShowUnlockModal(false);
      setAdminPasswordInput('');
      setAdminPasswordError('');
    } else {
      setAdminPasswordError('كلمة المرور غير صحيحة! يرجى إدخال باسورد المسؤول');
    }
  };

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || employees[0] || null;
  }, [employees, selectedEmpId]);

  // Company HQ coordinates
  const companyLat = companySettings.companyLat ?? 30.0444;
  const companyLng = companySettings.companyLng ?? 31.2357;
  const allowedRadius = companySettings.allowedRadiusMeters ?? 50;
  const companyAddress = companySettings.companyAddress || 'المقر الرئيسي للشركة';
  const isGeofenceEnabled = companySettings.enableGeofenceAttendance ?? true;

  // Calculate live distance
  const currentDistance = useMemo(() => {
    if (!gpsLocation) return null;
    return calculateHaversineDistance(
      gpsLocation.latitude,
      gpsLocation.longitude,
      companyLat,
      companyLng
    );
  }, [gpsLocation, companyLat, companyLng]);

  const isInRange = useMemo(() => {
    if (!isGeofenceEnabled) return true;
    if (currentDistance === null) return false;
    return currentDistance <= allowedRadius;
  }, [currentDistance, allowedRadius, isGeofenceEnabled]);

  // Fetch current GPS position
  const fetchLocation = useCallback(async () => {
    setIsLocating(true);
    setGpsError(null);

    const res = await getCurrentUserLocation(15000);
    setIsLocating(false);

    if (res.success && res.location) {
      setGpsLocation(res.location);
      const now = new Date();
      setLastLocateTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    } else {
      setGpsError(res.error || 'تعذر تحديد الموقع الجغرافي.');
    }
  }, []);

  // Auto locate on initial load
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Handle employee selection
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmpId(emp.id);
    if (isKiosk) {
      localStorage.setItem('kiosk_locked_emp_id', emp.id);
      setIsEmpLocked(true);
    } else {
      localStorage.setItem('last_mobile_emp_id', emp.id);
    }
    setShowEmpSelector(false);
  };

  // Filtered employees for dropdown
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const q = searchTerm.trim().toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    );
  }, [employees, searchTerm]);

  // Today's attendance for selected employee
  const todayStr = getTodayDateString();
  const todayRecord = useMemo(() => {
    if (!selectedEmployee) return null;
    return attendanceRecords.find(
      (r) =>
        r.date === todayStr &&
        (r.employeeId === selectedEmployee.id ||
          r.employeeId === `emp-dat-${selectedEmployee.employeeCode}` ||
          r.employeeId === selectedEmployee.employeeCode)
    );
  }, [attendanceRecords, selectedEmployee, todayStr]);

  // Handle Punch (Check-In or Check-Out)
  const handlePunch = async (punchType: 'check_in' | 'check_out') => {
    if (!selectedEmployee) {
      alert('يرجى اختيار الموظف أولاً.');
      return;
    }

    if (!gpsLocation) {
      setIsPunching(true);
      const locRes = await getCurrentUserLocation(12000);
      setIsPunching(false);

      if (!locRes.success || !locRes.location) {
        setGpsError(locRes.error || 'يرجى تفعيل إذن الـ GPS للسماح بتسجيل الحضور.');
        return;
      }
      setGpsLocation(locRes.location);
    }

    const activeGps = gpsLocation;
    if (!activeGps) {
      alert('تعذر قراءة إحداثيات الموقع.');
      return;
    }

    setIsPunching(true);

    const payload: MobilePunchPayload = {
      employeeId: selectedEmployee.id,
      employeeCode: selectedEmployee.employeeCode,
      employeeName: selectedEmployee.name,
      punchType,
      userLat: activeGps.latitude,
      userLng: activeGps.longitude,
      accuracyMeters: activeGps.accuracy,
      deviceInfo: navigator.userAgent ? 'Mobile Browser' : 'Web App',
    };

    // Client and backend validation
    const result = validateAndProcessPunch(payload, companySettings, shifts);

    if (!result.success) {
      setPunchResult(result);
      setIsPunching(false);
      return;
    }

    // Process record update into state
    const now = new Date();
    const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let recordToSave: AttendanceRecord;

    if (todayRecord) {
      // Update existing record for today
      recordToSave = {
        ...todayRecord,
        checkIn: punchType === 'check_in' ? timeNow : (todayRecord.checkIn || timeNow),
        checkOut: punchType === 'check_out' ? timeNow : (todayRecord.checkOut || '-'),
        userLat: activeGps.latitude,
        userLng: activeGps.longitude,
        distanceMeters: result.distanceMeters,
        geofenceStatus: result.inRange ? 'in_range' : 'out_of_range',
        verificationMethod: 'gps_mobile',
        notes: `تسجيل عبر الموبايل (GPS: ${activeGps.latitude.toFixed(5)}, ${activeGps.longitude.toFixed(5)} - بعد ${Math.round(result.distanceMeters)}م)`,
      };

      if (punchType === 'check_in') {
        recordToSave.checkInLat = activeGps.latitude;
        recordToSave.checkInLng = activeGps.longitude;
        recordToSave.checkInDistance = result.distanceMeters;
      } else {
        recordToSave.checkOutLat = activeGps.latitude;
        recordToSave.checkOutLng = activeGps.longitude;
        recordToSave.checkOutDistance = result.distanceMeters;
      }

      const fixed = fixAttendanceRecord(recordToSave, shifts);
      if (onRecordPunch) {
        onRecordPunch(fixed);
      }
      if (onUpdateAttendanceRecord) {
        onUpdateAttendanceRecord(fixed);
      }
      if (onAddAttendanceRecord) {
        onAddAttendanceRecord(fixed);
      }
      result.record = fixed;
    } else {
      // Create new record for today
      recordToSave = {
        id: `att-mobile-${selectedEmployee.id}-${todayStr}-${Date.now()}`,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        department: selectedEmployee.department || 'عام',
        date: todayStr,
        checkIn: punchType === 'check_in' ? timeNow : '-',
        checkOut: punchType === 'check_out' ? timeNow : '-',
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        status: 'present',
        shiftName: shifts[0]?.name || 'الوردية الصباحية',
        userLat: activeGps.latitude,
        userLng: activeGps.longitude,
        distanceMeters: result.distanceMeters,
        geofenceStatus: result.inRange ? 'in_range' : 'out_of_range',
        verificationMethod: 'gps_mobile',
        notes: `تسجيل عبر الموبايل (GPS: ${activeGps.latitude.toFixed(5)}, ${activeGps.longitude.toFixed(5)} - بعد ${Math.round(result.distanceMeters)}م)`,
        checkInLat: punchType === 'check_in' ? activeGps.latitude : undefined,
        checkInLng: punchType === 'check_in' ? activeGps.longitude : undefined,
        checkInDistance: punchType === 'check_in' ? result.distanceMeters : undefined,
        checkOutLat: punchType === 'check_out' ? activeGps.latitude : undefined,
        checkOutLng: punchType === 'check_out' ? activeGps.longitude : undefined,
        checkOutDistance: punchType === 'check_out' ? result.distanceMeters : undefined,
      };

      const fixed = fixAttendanceRecord(recordToSave, shifts);
      if (onRecordPunch) {
        onRecordPunch(fixed);
      }
      if (onAddAttendanceRecord) {
        onAddAttendanceRecord(fixed);
      }
      if (onUpdateAttendanceRecord) {
        onUpdateAttendanceRecord(fixed);
      }
      result.record = fixed;
    }

    setPunchResult(result);
    setIsPunching(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Top Bar */}
      <div className="max-w-md mx-auto w-full space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{companySettings.companyName || 'Smart HR'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800/60 font-mono font-bold">
                  GPS Mobile
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">بوابة الحضور والانصراف الذكية بالموقع الجغرافي</p>
            </div>
          </div>

          {isKiosk && onLogout ? (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-800/80 shadow-sm cursor-pointer active:scale-95"
              title="تسجيل الخروج والعودة للوحة الدخول"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل خروج</span>
            </button>
          ) : onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700/50"
            >
              <span>الرئيسية</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Live Clock & Date Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          
          <div className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono py-1">
            {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>

          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>الساعة متزامنة ومحدثة لحظياً</span>
          </div>
        </div>

        {/* Employee Card & Selector */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>الموظف المسجل على الجهاز</span>
            </span>

            {isKiosk && isEmpLocked ? (
              <button
                onClick={() => {
                  setAdminPasswordInput('');
                  setAdminPasswordError('');
                  setShowUnlockModal(true);
                }}
                className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="انقر لتعديل الموظف باستخدام باسورد المسؤول"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>مقفل (تعديل الموظف)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowEmpSelector(!showEmpSelector)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
              >
                <span>{showEmpSelector ? 'إغلاق' : 'تبديل الموظف'}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showEmpSelector ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>

          {isKiosk && !isEmpLocked && (
            <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-700/70 text-indigo-200 text-xs space-y-1">
              <div className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>إدخال الموظف لمرة واحدة (رمز 1000)</span>
              </div>
              <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                اختر الموظف الخاص بهذا الجهاز لربطه فورياً. تنبيه: لن يتم السماح بتبديل الموظف بعد الاختيار.
              </p>
            </div>
          )}

          {showEmpSelector ? (
            <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالاسم أو الرقم الوظيفي..."
                  className="w-full py-2 px-3 pr-9 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between border ${
                      selectedEmployee?.id === emp.id
                        ? 'bg-blue-950/60 border-blue-600 text-white font-black'
                        : 'bg-slate-950/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="truncate text-right">
                        <div className="text-xs font-bold truncate">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">كود: {emp.employeeCode || emp.id} | {emp.department || 'عام'}</div>
                      </div>
                    </div>
                    {selectedEmployee?.id === emp.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-sm text-white shadow-sm shrink-0">
                  {selectedEmployee?.name ? selectedEmployee.name.charAt(0) : 'م'}
                </div>
                <div className="truncate">
                  <div className="text-sm font-extrabold text-white truncate">{selectedEmployee?.name || 'لم يتم تحديد موظف'}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>كود: <strong className="text-slate-200">{selectedEmployee?.employeeCode || selectedEmployee?.id}</strong></span>
                    <span>•</span>
                    <span>{selectedEmployee?.department || 'عام'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Today's Status Preview */}
          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">وقت حضور اليوم</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                {todayRecord?.checkIn && todayRecord.checkIn !== '-' ? todayRecord.checkIn : 'لم يُسجل بعد'}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">وقت انصراف اليوم</span>
              <span className="text-xs font-black text-amber-400 font-mono">
                {todayRecord?.checkOut && todayRecord.checkOut !== '-' ? todayRecord.checkOut : 'لم يُسجل بعد'}
              </span>
            </div>
          </div>
        </div>

        {/* GPS Location & Geofence Radar Card */}
        <div className={`p-4 rounded-3xl border transition-all space-y-3 ${
          isInRange
            ? 'bg-slate-900 border-emerald-900/60 shadow-lg shadow-emerald-950/20'
            : gpsLocation
            ? 'bg-slate-900 border-rose-900/60 shadow-lg shadow-rose-950/20'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 ${isInRange ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-xs font-extrabold text-white">فحص النطاق الجغرافي (GPS)</span>
            </div>

            <button
              onClick={fetchLocation}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-700 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'تحديد الموقع...' : 'تحديث الموقع'}</span>
            </button>
          </div>

          {/* Status Badge */}
          {isLocating ? (
            <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري التقاط إشارة الأقمار الصناعية (GPS)...</span>
              </div>
              <p className="text-[10px] text-slate-400">يرجى التأكد من تشغيل الموقع بالهاتف والسماح للمتصفح بالوصول</p>
            </div>
          ) : gpsError ? (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>تعذر قراءة الموقع</span>
              </div>
              <p className="text-[11px] text-rose-300 leading-relaxed">{gpsError}</p>
              <button
                onClick={fetchLocation}
                className="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                إعادة المحاولة الآن
              </button>
            </div>
          ) : gpsLocation ? (
            <div className="space-y-2.5">
              <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                isInRange
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isInRange ? 'bg-emerald-900/60 text-emerald-400' : 'bg-rose-900/60 text-rose-400'
                }`}>
                  {isInRange ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>

                <div className="flex-1 text-right">
                  <div className="text-xs font-black">
                    {isInRange ? 'أنت داخل نطاق العمل المعتمد ✅' : 'أنت خارج نطاق مقر الشركة ⚠️'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    المسافة الحالية: <strong className="font-mono">{formatDistanceArabic(currentDistance ?? 0)}</strong> (الحد المسموح: {allowedRadius} متر)
                  </div>
                </div>
              </div>

              {/* Coordinates Info */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">إحداثياتك:</span>
                  <span>{gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">دقة الـ GPS:</span>
                  <span>±{gpsLocation.accuracy} متر</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">
              اضغط على &quot;تحديث الموقع&quot; لقراءة الإحداثيات والتحقق من النطاق.
            </div>
          )}

          <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>المقر: {companyAddress} ({companyLat.toFixed(4)}, {companyLng.toFixed(4)})</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => handlePunch('check_in')}
            disabled={isPunching || isLocating}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer disabled:opacity-50 ${
              isInRange
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                : 'bg-emerald-800/50 hover:bg-emerald-700/60 text-white border border-emerald-700/50 shadow-emerald-950/20'
            }`}
          >
            {isPunching ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5 text-emerald-200" />
            )}
            <span>تسجيل حضور (Check-In)</span>
          </button>

          <button
            onClick={() => handlePunch('check_out')}
            disabled={isPunching || isLocating}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer disabled:opacity-50 ${
              isInRange
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30'
                : 'bg-amber-800/50 hover:bg-amber-700/60 text-white border border-amber-700/50 shadow-amber-950/20'
            }`}
          >
            {isPunching ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-amber-200" />
            )}
            <span>تسجيل انصراف (Check-Out)</span>
          </button>
        </div>
      </div>

      {/* Result Notification Modal / Dialog */}
      {punchResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-xl ${
              punchResult.success && punchResult.inRange
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                : punchResult.success
                ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-amber-500/30'
                : 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30'
            }`}>
              {punchResult.success ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">
                {punchResult.success
                  ? punchResult.punchType === 'check_in'
                    ? 'تم تسجيل الحضور بنجاح!'
                    : 'تم تسجيل الانصراف بنجاح!'
                  : 'تعذر التسجيل'}
              </h3>
              <p className={`text-xs leading-relaxed ${
                punchResult.success ? 'text-slate-300' : 'text-rose-300'
              }`}>
                {punchResult.message}
              </p>
            </div>

            {punchResult.success && (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 font-mono text-slate-300 text-right">
                <div className="flex justify-between">
                  <span className="text-slate-500">الموظف:</span>
                  <span className="font-bold text-white">{selectedEmployee?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الوقت:</span>
                  <span className="font-bold text-blue-400">{punchResult.timeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المسافة عن المقر:</span>
                  <span className="font-bold text-emerald-400">{formatDistanceArabic(punchResult.distanceMeters)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">النطاق المسموح:</span>
                  <span>{punchResult.allowedRadiusMeters} متر</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setPunchResult(null)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              تم، العودة للشاشة
            </button>
          </div>
        </div>
      )}

      {/* Admin Unlock Modal for Changing Kiosk Employee */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">تعديل الموظف المسجل</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يتطلب تغيير الموظف المسجل على هذا الجهاز إدخال كلمة مرور المسؤول
              </p>
            </div>

            <form onSubmit={handleVerifyAdminPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة مرور المسؤول:
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 text-center font-mono tracking-widest"
                  dir="ltr"
                />
              </div>

              {adminPasswordError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
                  {adminPasswordError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setAdminPasswordInput('');
                    setAdminPasswordError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  تأكيد وفك القفل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="max-w-md mx-auto w-full pt-4 pb-2 text-center text-[10px] text-slate-600 border-t border-slate-900 mt-4">
        <span>نظام Smart HR © الحضور الذكي عبر الموبايل بالموقع الجغرافي</span>
      </div>
    </div>
  );
};
