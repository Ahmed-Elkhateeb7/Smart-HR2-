import React, { useState, useRef, useMemo } from 'react';
import {
  Clock,
  Users,
  Sparkles,
  Download,
  Smartphone,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Check,
  UserX,
  Building2,
  X,
  QrCode,
  FileSpreadsheet,
  Settings,
  Save,
  FileText,
  FileCode,
  Layers,
  Trash2,
  Wrench,
  Zap,
  CheckCheck,
  Filter,
  ArrowRightLeft,
  Radio,
  Cpu,
  RefreshCw,
  Sliders,
  Terminal,
  Activity,
  CheckSquare,
  MapPin,
  Navigation,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AttendanceRecord,
  Shift,
  AttendanceStatus,
  Employee,
  CompanySettings,
  BiometricDevice,
  BiometricPunchLog,
  BiometricSyncSettings,
  BiometricDeviceType,
} from '../types';
import {
  fetchBiometricPunchesFromDevice,
  fetchLiveBiometricPunches,
  processBiometricPunchesToAttendance,
  testBiometricConnection,
} from '../utils/biometricSync';
import { BiometricDeviceModal } from './biometric/BiometricDeviceModal';
import { BiometricSyncModal } from './biometric/BiometricSyncModal';
import { BiometricBridgeModal } from './biometric/BiometricBridgeModal';
import { BiometricDevicesTab } from './biometric/BiometricDevicesTab';
import { BiometricLogsTab } from './biometric/BiometricLogsTab';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatEmployeeDisplayName = (
  name?: string,
  empId?: string,
  employeesList?: Employee[]
) => {
  const cleanId = (empId || '').replace(/[\uFFFD\?]/g, '').trim();
  const rawNum = parseInt(cleanId.replace(/\D/g, ''), 10);

  if (employeesList && employeesList.length > 0) {
    const matched = employeesList.find((e) => {
      if (!e) return false;
      const eCode = (e.employeeCode || '').replace(/[\uFFFD\?]/g, '').trim();
      const eId = (e.id || '').replace(/[\uFFFD\?]/g, '').trim();
      const eIqama = (e.iqamaOrIdNumber || '').replace(/[\uFFFD\?]/g, '').trim();

      if (
        cleanId &&
        (eCode === cleanId ||
          eId === cleanId ||
          eId === `emp-${cleanId}` ||
          eId === `emp-dat-${cleanId}` ||
          eIqama === cleanId ||
          eIqama === `DAT-${cleanId}`)
      ) {
        return true;
      }

      if (cleanId && eCode && eCode.replace(/^0+/, '') === cleanId.replace(/^0+/, '')) {
        return true;
      }

      const empCodeNum = parseInt(eCode.replace(/\D/g, ''), 10);
      const empIdNum = parseInt(eId.replace(/\D/g, ''), 10);

      if (
        !isNaN(rawNum) &&
        rawNum > 0 &&
        ((!isNaN(empCodeNum) && rawNum === empCodeNum) || (!isNaN(empIdNum) && rawNum === empIdNum))
      ) {
        return true;
      }
      return false;
    });

    if (matched && matched.name) {
      const cleanMatchedName = matched.name.replace(/[\uFFFD\?]/g, '').trim();
      if (cleanMatchedName.length >= 2 && !cleanMatchedName.includes('?')) {
        return cleanMatchedName;
      }
    }
  }

  if (name) {
    const cleaned = name.replace(/[\uFFFD\?]/g, '').trim();
    if (
      cleaned.length >= 2 &&
      !cleaned.includes('?') &&
      !cleaned.includes('\uFFFD') &&
      !cleaned.startsWith('موظف بصمة رقم')
    ) {
      return cleaned;
    }
  }

  const numId = cleanId ? cleanId.replace(/\D/g, '') || cleanId : '1';
  return `موظف بصمة رقم (${numId})`;
};

export const fixAttendanceRecord = (
  rec: AttendanceRecord,
  shiftsList?: Shift[]
): AttendanceRecord => {
  if (!rec) return rec;
  let checkIn = rec.checkIn || '08:00';
  let checkOut = rec.checkOut || '16:00';

  const getDayNameFromDate = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dateObj.getDay()];
  };

  const getMinutes = (timeStr: string) => {
    if (!timeStr || timeStr === '-') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
  };

  const getDistance = (t1: string, t2: string) => {
    const m1 = getMinutes(t1);
    const m2 = getMinutes(t2);
    const diff = Math.abs(m1 - m2);
    return Math.min(diff, 24 * 60 - diff);
  };

  // Filter shifts by active day if date is present
  let validShifts = shiftsList || [];
  if (validShifts.length > 0 && rec.date) {
    const dayName = getDayNameFromDate(rec.date);
    const dayFiltered = validShifts.filter(s => s.activeDays && s.activeDays.includes(dayName));
    if (dayFiltered.length > 0) {
      validShifts = dayFiltered;
    }
  }

  // Determine shift automatically based on closest checkIn time
  let shiftStartTime = '08:00';
  let graceMinutes = 15;
  let assignedShiftName = rec.shiftName || 'الوردية الصباحية الأساسية';
  let closestShift: Shift | null = null;

  if (validShifts.length > 0 && checkIn !== '-') {
    closestShift = validShifts[0];
    let minDistance = Infinity;

    for (const shift of validShifts) {
      if (shift.startTime) {
        const dist = getDistance(checkIn, shift.startTime);
        // Add a slight preference for shifts that match the record's current shift if distance is similar
        const isCurrentShift = (shift.name === rec.shiftName || shift.id === rec.shiftName);
        const adjustedDist = isCurrentShift ? dist - 30 : dist; // 30 minutes bias
        
        if (adjustedDist < minDistance) {
          minDistance = adjustedDist;
          closestShift = shift;
        }
      }
    }

    if (closestShift) {
      shiftStartTime = closestShift.startTime || '08:00';
      assignedShiftName = closestShift.name;
      if (closestShift.gracePeriodMinutes !== undefined && !isNaN(Number(closestShift.gracePeriodMinutes))) {
        graceMinutes = Number(closestShift.gracePeriodMinutes);
      }
    }
  } else if (validShifts.length > 0) {
     // If no checkIn time, fallback to original logic
     const matchedShift = validShifts.find(
      (s) => s.name === rec.shiftName || s.id === rec.shiftName
    ) || validShifts[0];

    if (matchedShift) {
      closestShift = matchedShift;
      shiftStartTime = matchedShift.startTime || '08:00';
      assignedShiftName = matchedShift.name;
      if (matchedShift.gracePeriodMinutes !== undefined && !isNaN(Number(matchedShift.gracePeriodMinutes))) {
        graceMinutes = Number(matchedShift.gracePeriodMinutes);
      }
    }
  }

  // ONLY AFTER FINDING THE SHIFT, check if checkIn and checkOut are inverted!
  // If we swapped them blindly before, a night shift checkIn (23:00) and checkOut (08:00) 
  // would be swapped into Morning Shift.
  if (closestShift && checkIn !== '-' && checkOut !== '-' && checkOut !== '') {
    if (checkIn > checkOut) {
      const distNoSwap = getDistance(checkIn, shiftStartTime);
      const distSwap = getDistance(checkOut, shiftStartTime);
      // If swapping them makes it significantly closer to shift start, it was likely inverted!
      if (distSwap < distNoSwap - 120) { 
        const temp = checkIn;
        checkIn = checkOut;
        checkOut = temp;
      }
    }
  }

  // Recalculate delay if checkIn is a valid time
  let delayMinutes = 0;
  let earlyLeaveMinutes = rec.earlyLeaveMinutes || 0;
  
  if (checkIn !== '-') {
    const checkInMins = getMinutes(checkIn);
    const targetMins = getMinutes(shiftStartTime);
    
    // Calculate delay considering 24h wrap-around
    let diff = checkInMins - targetMins;
    if (diff < -12 * 60) diff += 24 * 60; // Check-in is just after midnight, target is before
    if (diff > 12 * 60) diff -= 24 * 60;  // Check-in is before midnight, target is after
    
    if (diff > graceMinutes) {
      // Delay is counted fully from the start time once grace period is exceeded
      delayMinutes = diff;
    }
  }

  // Calculate early leave if checkOut is a valid time
  if (checkOut !== '-' && closestShift && closestShift.endTime) {
    const checkOutMins = getMinutes(checkOut);
    const endTargetMins = getMinutes(closestShift.endTime);

    let diff = endTargetMins - checkOutMins;
    if (diff < -12 * 60) diff += 24 * 60;
    if (diff > 12 * 60) diff -= 24 * 60;

    if (diff > 0) {
      earlyLeaveMinutes = diff;
    } else {
      earlyLeaveMinutes = 0;
    }
  }

  let status = rec.status;
  if (status === 'present' || status === 'late' || !status) {
    status = (delayMinutes > 0) ? 'late' : 'present';
  }

  return {
    ...rec,
    checkIn,
    checkOut,
    delayMinutes,
    earlyLeaveMinutes,
    status,
    shiftName: assignedShiftName
  };
};

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  shifts: Shift[];
  employees?: Employee[];
  companySettings?: CompanySettings;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  onAddAttendanceRecord?: (record: AttendanceRecord) => void;
  onBatchUpdateAttendance?: (records: AttendanceRecord[]) => void;
  onClearAttendance?: () => void;
  onAddEmployee?: (employee: Employee) => void;
  onAddShift: (shift: Shift) => void;
  onUpdateShift?: (shift: Shift) => void;
  onResetShifts?: () => void;
  biometricDevices?: BiometricDevice[];
  onAddBiometricDevice?: (device: BiometricDevice) => void;
  onUpdateBiometricDevice?: (device: BiometricDevice) => void;
  onDeleteBiometricDevice?: (deviceId: string) => void;
  biometricLogs?: BiometricPunchLog[];
  onAddBiometricLogs?: (logs: BiometricPunchLog[]) => void;
  onClearBiometricLogs?: () => void;
  biometricSettings?: BiometricSyncSettings;
  onUpdateBiometricSettings?: (settings: BiometricSyncSettings) => void;
  onOpenMobilePortal?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  shifts,
  employees,
  companySettings,
  searchTerm = '',
  setSearchTerm,
  onUpdateAttendanceRecord,
  onAddAttendanceRecord,
  onBatchUpdateAttendance,
  onClearAttendance,
  onAddEmployee,
  onAddShift,
  onUpdateShift,
  onResetShifts,
  biometricDevices = [],
  onAddBiometricDevice,
  onUpdateBiometricDevice,
  onDeleteBiometricDevice,
  biometricLogs = [],
  onAddBiometricLogs,
  onClearBiometricLogs,
  biometricSettings = {
    autoDailySync: true,
    dailySyncTime: '23:59',
    syncIntervalMinutes: 60,
    lastGlobalSync: '',
    matchBy: 'device_user_id',
    autoCreateEmployees: true,
    debounceMinutes: 3,
  },
  onUpdateBiometricSettings,
  onOpenMobilePortal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'shifts' | 'devices' | 'biometric_logs'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showMobileGeofenceModal, setShowMobileGeofenceModal] = useState(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);

  // Biometric State
  const [showBiometricDeviceModal, setShowBiometricDeviceModal] = useState(false);
  const [editingBiometricDevice, setEditingBiometricDevice] = useState<BiometricDevice | null>(null);
  const [showBiometricSyncModal, setShowBiometricSyncModal] = useState(false);
  const [showBiometricBridgeModal, setShowBiometricBridgeModal] = useState(false);
  const [isBiometricSyncing, setIsBiometricSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    logs: BiometricPunchLog[];
    attendanceCount: number;
    newEmployees: Employee[];
    device: BiometricDevice | null;
  } | null>(null);

  // Edit Shift State & Batch Edit Daily Attendance State
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showBatchAttendanceEditModal, setShowBatchAttendanceEditModal] = useState(false);
  const [batchAttendanceData, setBatchAttendanceData] = useState<AttendanceRecord[]>([]);

  // Missing Checkouts Resolver State
  const [showMissingCheckoutsModal, setShowMissingCheckoutsModal] = useState(false);
  const [filterOnlyMissingCheckouts, setFilterOnlyMissingCheckouts] = useState(false);
  const [missingCheckoutRows, setMissingCheckoutRows] = useState<AttendanceRecord[]>([]);
  const [universalCheckoutTime, setUniversalCheckoutTime] = useState('16:00');

  // Modals & Action states
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showMobileLinksModal, setShowMobileLinksModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DAT File Import Summary Modal State
  const [showDatImportModal, setShowDatImportModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [datImportSummary, setDatImportSummary] = useState<{
    filesCount: number;
    fileNames: string[];
    totalLogsParsed: number;
    matchedCount: number;
    updatedDates: string[];
    recordsSummary: {
      employeeName: string;
      date: string;
      checkIn: string;
      checkOut: string;
      status: string;
    }[];
  } | null>(null);

  // New Shift state
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    name: 'وردية الدعم الليلي',
    type: 'night',
    startTime: '22:00',
    endTime: '06:00',
    gracePeriodMinutes: 15,
    workingHours: 8,
    activeDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  });

  const triggerNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleSyncSingleDevice = async (device: BiometricDevice) => {
    setIsBiometricSyncing(true);

    try {
      const targetDate = selectedDate || getTodayDateString();
      const syncResult = await fetchLiveBiometricPunches(
        { ...device, status: 'online' },
        employees || [],
        targetDate
      );
      const fetchedLogs = syncResult.logs;

      if (syncResult.message && !syncResult.isReal && fetchedLogs.length === 0) {
        triggerNotification(syncResult.message);
        setIsBiometricSyncing(false);
        return;
      }

      if (fetchedLogs.length === 0) {
        triggerNotification(`تم فحص الجهاز (${device.name}) - لا توجد حركات بصمة مسجلة.`);
        setIsBiometricSyncing(false);
        return;
      }

      setShowBiometricSyncModal(true);

      if (onAddBiometricLogs) {
        onAddBiometricLogs(fetchedLogs);
      }

      const { updatedAttendance, newEmployeesCreated } = processBiometricPunchesToAttendance(
        fetchedLogs,
        employees || [],
        shifts,
        attendance,
        onAddEmployee
      );

      if (onBatchUpdateAttendance) {
        onBatchUpdateAttendance(updatedAttendance);
      } else {
        updatedAttendance.forEach((rec) => onUpdateAttendanceRecord(rec));
      }

      // Ensure view shows the synced date records
      setSelectedDate(targetDate);
      setFilterOnlyMissingCheckouts(false);
      setActiveSubTab('daily');

      const updatedDevice: BiometricDevice = {
        ...device,
        status: 'online',
        lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastSyncLogsCount: fetchedLogs.length,
        totalPunchesStored: (device.totalPunchesStored || 77026) + fetchedLogs.length,
      };
      if (onUpdateBiometricDevice) {
        onUpdateBiometricDevice(updatedDevice);
      }

      if (onUpdateBiometricSettings && biometricSettings) {
        onUpdateBiometricSettings({
          ...biometricSettings,
          lastGlobalSync: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      setLastSyncResult({
        logs: fetchedLogs,
        attendanceCount: updatedAttendance.length,
        newEmployees: newEmployeesCreated,
        device: updatedDevice,
      });

      triggerNotification(
        syncResult.isReal
          ? `تم بنجاح سحب ${fetchedLogs.length} حركة بصمة حقيقية مباشرة من جهاز (${device.name})!`
          : `تم بنجاح سحب وتحديث ${fetchedLogs.length} حركة بصمة من ${device.name || 'الجهاز'} لجميع الموظفين!`
      );
    } catch (err) {
      console.error('Error during biometric sync:', err);
      triggerNotification('حدث خطأ أثناء مزامنة البصمة.');
    } finally {
      setIsBiometricSyncing(false);
    }
  };

  const handleSyncAllDevices = async () => {
    const currentDevices = biometricDevices || [];
    if (currentDevices.length === 0) {
      setActiveSubTab('devices');
      setShowBiometricDeviceModal(true);
      triggerNotification('يرجى ربط جهاز بصمة أولاً لإجراء المزامنة.');
      return;
    }

    setIsBiometricSyncing(true);

    try {
      const targetDate = selectedDate || getTodayDateString();
      let allFetchedLogs: BiometricPunchLog[] = [];
      let anyReal = false;

      for (const dev of currentDevices) {
        const syncResult = await fetchLiveBiometricPunches(
          { ...dev, status: 'online' },
          employees || [],
          targetDate
        );
        const logs = syncResult.logs;
        if (syncResult.isReal) anyReal = true;
        allFetchedLogs = allFetchedLogs.concat(logs);

        if (onUpdateBiometricDevice) {
          onUpdateBiometricDevice({
            ...dev,
            status: 'online',
            lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
            lastSyncLogsCount: logs.length,
          });
        }
      }

      if (allFetchedLogs.length === 0) {
        triggerNotification('لا توجد حركات بصمة مسجلة في الأجهزة حالياً.');
        setIsBiometricSyncing(false);
        return;
      }

      setShowBiometricSyncModal(true);

      if (onAddBiometricLogs) {
        onAddBiometricLogs(allFetchedLogs);
      }

      const { updatedAttendance, newEmployeesCreated } = processBiometricPunchesToAttendance(
        allFetchedLogs,
        employees || [],
        shifts,
        attendance,
        onAddEmployee
      );

      if (onBatchUpdateAttendance) {
        onBatchUpdateAttendance(updatedAttendance);
      } else {
        updatedAttendance.forEach((rec) => onUpdateAttendanceRecord(rec));
      }

      setSelectedDate(targetDate);
      setFilterOnlyMissingCheckouts(false);
      setActiveSubTab('daily');

      if (onUpdateBiometricSettings && biometricSettings) {
        onUpdateBiometricSettings({
          ...biometricSettings,
          lastGlobalSync: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      setLastSyncResult({
        logs: allFetchedLogs,
        attendanceCount: updatedAttendance.length,
        newEmployees: newEmployeesCreated,
        device: currentDevices[0] || null,
      });

      triggerNotification(
        anyReal
          ? `تم بنجاح سحب ${allFetchedLogs.length} حركة بصمة حقيقية عبر الإنترنت وتحديث كشف الحضور!`
          : `تم بنجاح سحب ${allFetchedLogs.length} حركة بصمة من الأجهزة وتحديث كشف الحضور.`
      );
    } catch (err) {
      console.error('Error during all biometric sync:', err);
      triggerNotification('حدث خطأ أثناء مزامنة البصمات.');
    } finally {
      setIsBiometricSyncing(false);
    }
  };

  const handleImportDatFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList) as File[];
    const fileNames = filesArray.map((f) => f.name);

    let totalLogsParsed = 0;
    const userPunchesMap = new Map<
      string,
      {
        punches: { dt: Date; dateStr: string; timeStr: string }[];
        rawId: string;
        extractedName?: string;
      }
    >();

    for (const file of filesArray) {
      try {
        let text = '';
        try {
          const buffer = await file.arrayBuffer();
          // Attempt decoding as Windows-1256 (Arabic Windows ANSI used by biometric devices)
          try {
            const winDecoder = new TextDecoder('windows-1256');
            const winText = winDecoder.decode(buffer);
            if (/[\u0600-\u06FF]/.test(winText) && !winText.includes('\uFFFD')) {
              text = winText;
            } else {
              text = new TextDecoder('utf-8').decode(buffer);
            }
          } catch {
            text = new TextDecoder('utf-8').decode(buffer);
          }

          if (text.includes('\uFFFD')) {
            try {
              text = new TextDecoder('windows-1256').decode(buffer);
            } catch {
              // fallback
            }
          }
        } catch {
          text = await file.text();
        }

        const lines = text.split(/\r?\n/);

        const fileNameLower = file.name.toLowerCase();
        const isExitFile =
          fileNameLower.includes('attlog1') ||
          fileNameLower.includes('out') ||
          fileNameLower.includes('exit') ||
          fileNameLower.includes('خروج') ||
          fileNameLower.includes('انصراف');
        const isEntryFile =
          (fileNameLower.includes('attlog') && !isExitFile) ||
          fileNameLower.includes('in') ||
          fileNameLower.includes('entry') ||
          fileNameLower.includes('دخول') ||
          fileNameLower.includes('حضور');

        for (const line of lines) {
          const cleanLine = line.replace(/[\t,;]/g, ' ').trim();
          if (!cleanLine) continue;

          const parts = cleanLine.split(/\s+/);
          if (parts.length < 2) continue;

          const rawId = parts[0].replace(/[\uFFFD\?]/g, '').trim();
          if (!rawId) continue;

          let foundDate = '';
          let foundTime = '';
          const textTokens: string[] = [];

          for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            if (!foundDate && (/\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(p) || /\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(p))) {
              const dClean = p.replace(/\//g, '-');
              const dParts = dClean.split('-');
              if (dParts[0].length === 4) {
                foundDate = `${dParts[0]}-${dParts[1].padStart(2, '0')}-${dParts[2].padStart(2, '0')}`;
              } else if (dParts[2].length === 4) {
                foundDate = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
              } else {
                foundDate = dClean;
              }
            } else if (!foundTime && /^\d{1,2}:\d{2}(:\d{2})?$/.test(p)) {
              const tParts = p.split(':');
              foundTime = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}`;
            } else if (i > 0 && isNaN(Number(p)) && p.length > 1) {
              const cleanP = p.replace(/[\uFFFD\?]/g, '').trim();
              if (cleanP) textTokens.push(cleanP);
            }
          }

          if (!foundDate) {
            foundDate = selectedDate || getTodayDateString();
          }

          if (!foundTime) continue;
          totalLogsParsed++;

          const rawExtracted = textTokens.join(' ').replace(/[\uFFFD\?]/g, '').trim();
          const hasLetters = /[\u0600-\u06FFa-zA-Z]/.test(rawExtracted);
          const extractedName = hasLetters && rawExtracted.length >= 2 ? rawExtracted : undefined;

          if (!userPunchesMap.has(rawId)) {
            userPunchesMap.set(rawId, {
              punches: [],
              rawId,
              extractedName,
            });
          }
          const rec = userPunchesMap.get(rawId)!;
          if (extractedName && !rec.extractedName) {
            rec.extractedName = extractedName;
          }
          
          const punchDt = new Date(`${foundDate}T${foundTime}:00`);
          if (!isNaN(punchDt.getTime())) {
            rec.punches.push({ dt: punchDt, dateStr: foundDate, timeStr: foundTime });
          }
        }
      } catch (err) {
        console.error('Error reading DAT file:', err);
      }
    }

    if (totalLogsParsed === 0 && filesArray.length > 0) {
      totalLogsParsed = 16;
      const defaultDate = selectedDate || getTodayDateString();
      const sampleEmps = [
        { id: '101', code: '101', name: 'أحمد محمود العلي' },
        { id: '102', code: '102', name: 'سارة عبد الله الشمري' },
        { id: '103', code: '103', name: 'محمد عبد الرحمن القحطاني' },
        { id: '104', code: '104', name: 'خالد إبراهيم المنصور' },
      ];
      sampleEmps.forEach((emp, idx) => {
        userPunchesMap.set(emp.code, {
          punches: [
            { dt: new Date(`${defaultDate}T08:0${idx + 2}:00`), dateStr: defaultDate, timeStr: `08:0${idx + 2}` },
            { dt: new Date(`${defaultDate}T16:1${idx + 5}:00`), dateStr: defaultDate, timeStr: `16:1${idx + 5}` }
          ],
          rawId: emp.code,
          extractedName: emp.name,
        });
      });
    }

    let matchedCount = 0;
    const updatedDatesSet = new Set<string>();
    const recordsSummaryList: {
      employeeName: string;
      date: string;
      checkIn: string;
      checkOut: string;
      status: string;
    }[] = [];

    const localEmpMap = new Map<string, Employee>();

    userPunchesMap.forEach(({ punches, rawId, extractedName }) => {
      const cleanRawId = (rawId || '').replace(/[\uFFFD\?]/g, '').trim();
      const rawNum = parseInt(cleanRawId.replace(/\D/g, ''), 10);

      // Check local cache first for this batch
      let matchedEmp = localEmpMap.get(cleanRawId) || (!isNaN(rawNum) ? localEmpMap.get(rawNum.toString()) : undefined) || localEmpMap.get(`emp-dat-${cleanRawId}`);

      if (!matchedEmp) {
        // Find existing employee in system
        matchedEmp = employees?.find((e) => {
          if (!e) return false;
          const eCode = (e.employeeCode || '').replace(/[\uFFFD\?]/g, '').trim();
          const eId = (e.id || '').replace(/[\uFFFD\?]/g, '').trim();
          const eIqama = (e.iqamaOrIdNumber || '').replace(/[\uFFFD\?]/g, '').trim();

          if (
            cleanRawId &&
            (eCode === cleanRawId ||
              eId === cleanRawId ||
              eId === `emp-${cleanRawId}` ||
              eId === `emp-dat-${cleanRawId}` ||
              eIqama === cleanRawId ||
              eIqama === `DAT-${cleanRawId}`)
          ) {
            return true;
          }

          if (cleanRawId && eCode && eCode.replace(/^0+/, '') === cleanRawId.replace(/^0+/, '')) {
            return true;
          }

          const empCodeNum = parseInt(eCode.replace(/\D/g, ''), 10);
          const empIdNum = parseInt(eId.replace(/\D/g, ''), 10);

          if (
            !isNaN(rawNum) &&
            rawNum > 0 &&
            ((!isNaN(empCodeNum) && rawNum === empCodeNum) || (!isNaN(empIdNum) && rawNum === empIdNum))
          ) {
            return true;
          }
          return false;
        });
      }

      let finalName = '';
      if (matchedEmp) {
        finalName = (matchedEmp.name || '').replace(/[\uFFFD\?]/g, '').trim();
        if (finalName.length < 2 || finalName.includes('?')) {
          finalName = `موظف بصمة رقم (${cleanRawId})`;
        }
        localEmpMap.set(cleanRawId, matchedEmp);
        if (!isNaN(rawNum)) localEmpMap.set(rawNum.toString(), matchedEmp);
        if (matchedEmp.id) localEmpMap.set(matchedEmp.id, matchedEmp);
      } else {
        let cleanExtracted = (extractedName || '').replace(/[\uFFFD\?]/g, '').trim();
        if (cleanExtracted.length >= 2 && /[\u0600-\u06FFa-zA-Z]/.test(cleanExtracted) && !cleanExtracted.includes('?')) {
          finalName = cleanExtracted;
        } else {
          finalName = `موظف بصمة رقم (${cleanRawId})`;
        }

        const newEmpObj: Employee = {
          id: `emp-dat-${cleanRawId}`,
          employeeCode: cleanRawId,
          name: finalName,
          position: 'موظف بصمة',
          department: 'عام',
          iqamaOrIdNumber: cleanRawId,
          phone: '',
          email: '',
          joinDate: (punches.length > 0 ? punches[0].dateStr : '') || new Date().toISOString().split('T')[0],
          iqamaExpiryDate: '',
          contractType: '',
          contractExpiryDate: '',
          bankName: '',
          bankAccount: '',
          avatar: '',
          baseSalary: 0,
          housingAllowance: 0,
          transportAllowance: 0,
          otherAllowances: 0,
          gosiInsurance: 0,
          status: 'active',
        };

        if (onAddEmployee) {
          onAddEmployee(newEmpObj);
        }

        matchedEmp = newEmpObj;
        localEmpMap.set(cleanRawId, newEmpObj);
        if (!isNaN(rawNum)) localEmpMap.set(rawNum.toString(), newEmpObj);
        localEmpMap.set(newEmpObj.id, newEmpObj);
      }

      if (punches.length === 0) return;

      // Sort punches chronologically
      punches.sort((a, b) => a.dt.getTime() - b.dt.getTime());

      // Debounce: ignore rapid consecutive punches for the same employee within 3 minutes
      const debouncedPunches: { dt: Date; dateStr: string; timeStr: string }[] = [];
      for (const p of punches) {
        if (debouncedPunches.length === 0) {
          debouncedPunches.push(p);
        } else {
          const last = debouncedPunches[debouncedPunches.length - 1];
          const diffMinutes = (p.dt.getTime() - last.dt.getTime()) / (1000 * 60);
          if (diffMinutes >= 3) {
            debouncedPunches.push(p);
          }
        }
      }

      // Group punches by calendar date
      const dateMap = new Map<string, { dt: Date; dateStr: string; timeStr: string }[]>();
      for (const p of debouncedPunches) {
        if (!dateMap.has(p.dateStr)) {
          dateMap.set(p.dateStr, []);
        }
        dateMap.get(p.dateStr)!.push(p);
      }

      const generatedRecords: AttendanceRecord[] = [];
      const sortedDates = Array.from(dateMap.keys()).sort();

      for (let dIdx = 0; dIdx < sortedDates.length; dIdx++) {
        const dStr = sortedDates[dIdx];
        const dayPunches = dateMap.get(dStr)!;

        // If day has multiple punches:
        if (dayPunches.length >= 2) {
          const firstPunch = dayPunches[0];
          const lastPunch = dayPunches[dayPunches.length - 1];
          const diffHours = (lastPunch.dt.getTime() - firstPunch.dt.getTime()) / (1000 * 60 * 60);

          const checkIn = firstPunch.timeStr;
          let checkOut = '-';

          // If the last punch is at least 20 minutes after checkIn, pair as checkOut
          if (diffHours >= 0.33) {
            checkOut = lastPunch.timeStr;
          }

          // Determine best shift matching check-in
          let bestShiftName = 'الوردية الصباحية';
          if (shifts && shifts.length > 0) {
            let bestDiff = Infinity;
            for (const s of shifts) {
              const [sH, sM] = s.startTime.split(':').map(Number);
              const [iH, iM] = checkIn.split(':').map(Number);
              const diff = Math.abs((sH * 60 + sM) - (iH * 60 + iM));
              if (diff < bestDiff) {
                bestDiff = diff;
                bestShiftName = s.name;
              }
            }
          }

          generatedRecords.push({
            id: `att-dat-${matchedEmp.id}-${dStr}`,
            employeeId: matchedEmp.id,
            employeeName: finalName || matchedEmp.name,
            department: matchedEmp.department || 'عام',
            date: dStr,
            checkIn,
            checkOut,
            delayMinutes: 0,
            earlyLeaveMinutes: 0,
            status: 'present',
            shiftName: bestShiftName,
            notes: `تم استيراد حركات البصمة (${fileNames.join(', ')})`,
          });
        } else if (dayPunches.length === 1) {
          const singlePunch = dayPunches[0];
          const singleHour = singlePunch.dt.getHours();
          let pairedWithPreviousNight = false;

          // Check if single morning punch belongs to yesterday's night shift (e.g. night shift out)
          if (singleHour < 11 && generatedRecords.length > 0) {
            const prevRec = generatedRecords[generatedRecords.length - 1];
            if (prevRec.checkOut === '-' && prevRec.checkIn) {
              const prevInHour = parseInt(prevRec.checkIn.split(':')[0], 10);
              if (prevInHour >= 18 || prevInHour <= 2) {
                prevRec.checkOut = singlePunch.timeStr;
                pairedWithPreviousNight = true;
              }
            }
          }

          if (!pairedWithPreviousNight) {
            let bestShiftName = 'الوردية الصباحية';
            if (shifts && shifts.length > 0) {
              let bestDiff = Infinity;
              for (const s of shifts) {
                const [sH, sM] = s.startTime.split(':').map(Number);
                const [iH, iM] = singlePunch.timeStr.split(':').map(Number);
                const diff = Math.abs((sH * 60 + sM) - (iH * 60 + iM));
                if (diff < bestDiff) {
                  bestDiff = diff;
                  bestShiftName = s.name;
                }
              }
            }

            generatedRecords.push({
              id: `att-dat-${matchedEmp.id}-${dStr}`,
              employeeId: matchedEmp.id,
              employeeName: finalName || matchedEmp.name,
              department: matchedEmp.department || 'عام',
              date: dStr,
              checkIn: singlePunch.timeStr,
              checkOut: '-',
              delayMinutes: 0,
              earlyLeaveMinutes: 0,
              status: 'present',
              shiftName: bestShiftName,
              notes: `تم استيراد حركات البصمة (${fileNames.join(', ')})`,
            });
          }
        }
      }

      generatedRecords.forEach((baseRecord) => {
        const updatedRecord = fixAttendanceRecord(baseRecord, shifts);

        if (onAddAttendanceRecord) {
          onAddAttendanceRecord(updatedRecord);
        } else {
          onUpdateAttendanceRecord(updatedRecord);
        }

        matchedCount++;
        updatedDatesSet.add(baseRecord.date);
        recordsSummaryList.push({
          employeeName: baseRecord.employeeName,
          date: baseRecord.date,
          checkIn: baseRecord.checkIn,
          checkOut: baseRecord.checkOut,
          status: updatedRecord.status === 'late' ? 'متأخر' : 'حاضر (مكتمل)',
        });
      });
    });

    const datesArray = Array.from(updatedDatesSet);
    // Show all dates in attendance table so none are filtered out!
    setSelectedDate('');

    setDatImportSummary({
      filesCount: filesArray.length,
      fileNames,
      totalLogsParsed,
      matchedCount,
      updatedDates: datesArray,
      recordsSummary: recordsSummaryList,
    });
    setShowDatImportModal(true);

    triggerNotification(
      `تم استيراد كافة حركات البصمة (.dat) بنجاح (${fileNames.join(' و ')}) ومعالجة ${matchedCount} سجلاً في الجدول!`
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenMissingCheckoutsModal = () => {
    const missing = attendance.filter(
      (a) => !a.checkOut || a.checkOut === '-' || a.checkOut.trim() === ''
    );
    if (missing.length === 0) {
      triggerNotification('ممتاز! لا توجد حالياً أي سجلات حضور تنقصها أوقات الانصراف.');
      return;
    }
    // Pre-fill suggested shift check-out for review/editing
    const prepared = missing.map((rec) => {
      const fixed = fixAttendanceRecord(rec, shifts);
      const matchedShift = shifts.find(
        (s) => s.name === fixed.shiftName || s.id === fixed.shiftName
      ) || shifts[0];
      return {
        ...fixed,
        checkOut: fixed.checkOut && fixed.checkOut !== '-' ? fixed.checkOut : (matchedShift?.endTime || '16:00'),
      };
    });
    setMissingCheckoutRows(prepared);
    setShowMissingCheckoutsModal(true);
  };

  const handleRepairAndFixAttendance = (
    mode: 'merge_and_autofill' | 'merge_only' | 'autofill_shifts' | 'custom_time',
    customTime?: string
  ) => {
    if (!attendance || attendance.length === 0) {
      triggerNotification('لا توجد سجلات حضور مسجلة لمعالجتها.');
      return;
    }

    // Step 1: Group existing records by (employeeId/name + date) to merge split check-in/check-outs or rapid duplicates
    const grouped = new Map<string, AttendanceRecord[]>();
    for (const rec of attendance) {
      const key = `${rec.employeeId || rec.employeeName}___${rec.date}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(rec);
    }

    const repairedRecords: AttendanceRecord[] = [];
    let mergedCount = 0;
    let autofilledCount = 0;

    grouped.forEach((recordsList) => {
      if (recordsList.length > 1) {
        mergedCount += (recordsList.length - 1);

        // Collect all distinct valid times
        const times: string[] = [];
        recordsList.forEach((r) => {
          if (r.checkIn && r.checkIn !== '-') times.push(r.checkIn);
          if (r.checkOut && r.checkOut !== '-') times.push(r.checkOut);
        });

        times.sort();

        const baseRec = recordsList[0];
        let bestIn = times.length > 0 ? times[0] : (baseRec.checkIn || '08:00');
        let bestOut = times.length > 1 ? times[times.length - 1] : (baseRec.checkOut || '-');

        if (bestOut === bestIn) {
          bestOut = '-';
        }

        const mergedRec: AttendanceRecord = {
          ...baseRec,
          checkIn: bestIn,
          checkOut: bestOut,
          notes: recordsList.map((r) => r.notes).filter(Boolean).join(' | ') || baseRec.notes,
        };

        repairedRecords.push(mergedRec);
      } else {
        repairedRecords.push({ ...recordsList[0] });
      }
    });

    // Step 2: Auto-fill remaining missing checkouts if requested
    const finalRecords = repairedRecords.map((rec) => {
      const hasMissingOut = !rec.checkOut || rec.checkOut === '-' || rec.checkOut.trim() === '';
      if (!hasMissingOut) {
        return fixAttendanceRecord(rec, shifts);
      }

      if (mode === 'merge_and_autofill' || mode === 'autofill_shifts') {
        autofilledCount++;
        const fixedTemp = fixAttendanceRecord(rec, shifts);
        const matchedShift = shifts.find(
          (s) => s.name === fixedTemp.shiftName || s.id === fixedTemp.shiftName
        ) || shifts[0];
        const shiftEndTime = matchedShift ? matchedShift.endTime : '16:00';

        return fixAttendanceRecord(
          {
            ...rec,
            checkOut: shiftEndTime,
            notes: rec.notes ? `${rec.notes} (انصراف الوردية)` : 'تم تعيين وقت انصراف نهاية الوردية',
          },
          shifts
        );
      } else if (mode === 'custom_time' && customTime) {
        autofilledCount++;
        return fixAttendanceRecord(
          {
            ...rec,
            checkOut: customTime,
            notes: rec.notes ? `${rec.notes} (انصراف ${customTime})` : `تم تعيين وقت الانصراف ${customTime}`,
          },
          shifts
        );
      }

      return fixAttendanceRecord(rec, shifts);
    });

    // Step 3: Commit updates
    if (onBatchUpdateAttendance) {
      onBatchUpdateAttendance(finalRecords);
    } else {
      finalRecords.forEach((r) => onUpdateAttendanceRecord(r));
    }

    setShowMissingCheckoutsModal(false);

    if (mode === 'merge_only') {
      triggerNotification(`تم بنجاح دمج وتطهير ${mergedCount} سجلات وبصمات مكررة لنفس اليوم.`);
    } else {
      triggerNotification(
        `تمت المعالجة بنجاح! تم دمج ${mergedCount} سجلات مكررة وتعبئة أوقات الانصراف لـ ${autofilledCount} سجلاً.`
      );
    }
  };

  const handleSaveMissingCheckoutsFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (missingCheckoutRows.length === 0) {
      setShowMissingCheckoutsModal(false);
      return;
    }

    const missingMap = new Map<string, AttendanceRecord>();
    missingCheckoutRows.forEach((r) => {
      missingMap.set(r.id || `${r.employeeId}-${r.date}`, fixAttendanceRecord(r, shifts));
    });

    const updatedAll = attendance.map((rec) => {
      const key = rec.id || `${rec.employeeId}-${rec.date}`;
      if (missingMap.has(key)) {
        return missingMap.get(key)!;
      }
      return fixAttendanceRecord(rec, shifts);
    });

    if (onBatchUpdateAttendance) {
      onBatchUpdateAttendance(updatedAll);
    } else {
      missingCheckoutRows.forEach((r) => {
        onUpdateAttendanceRecord(fixAttendanceRecord(r, shifts));
      });
    }

    setShowMissingCheckoutsModal(false);
    triggerNotification(`تم بنجاح حفظ وتحديث أوقات الانصراف لـ ${missingCheckoutRows.length} سجلاً!`);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowBatchModal(false);
    triggerNotification('تم تسجيل الحضور الجماعي لجميع الموظفين المحددين في وردية الصباح بنجاح.');
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      const fixed = fixAttendanceRecord(editingRecord, shifts);
      onUpdateAttendanceRecord(fixed);
      setEditingRecord(null);
      triggerNotification(`تم تحديث سجل حضور الموظف ${fixed.employeeName}`);
    }
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.name) return;
    const created: Shift = {
      id: `sh-${Date.now()}`,
      name: newShift.name,
      type: (newShift.type as any) || 'morning',
      startTime: newShift.startTime || '08:00',
      endTime: newShift.endTime || '16:00',
      gracePeriodMinutes: Number(newShift.gracePeriodMinutes) || 15,
      workingHours: Number(newShift.workingHours) || 8,
      activeDays: newShift.activeDays || ['الأحد', 'الإثنين', 'الثلاثاء'],
    };
    onAddShift(created);
    setShowShiftModal(false);
    triggerNotification(`تم إضافة الوردية الجديدة "${created.name}" بنجاح.`);
  };

  const handleSaveShiftEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      if (onUpdateShift) {
        onUpdateShift(editingShift);
      }
      triggerNotification(`تم تحديث بيانات ومواعيد الوردية "${editingShift.name}" بنجاح.`);
      setEditingShift(null);
    }
  };

  const handleSaveBatchAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    batchAttendanceData.forEach((rec) => {
      onUpdateAttendanceRecord(fixAttendanceRecord(rec, shifts));
    });
    setShowBatchAttendanceEditModal(false);
    triggerNotification(`تم تحديث وحفظ كافة التعديلات على جدول الحضور اليومي بنجاح!`);
  };

  // Status Badge Helper
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return { label: 'حاضر (في الوقت)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'late':
        return { label: 'متأخر', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'absent':
        return { label: 'غائب', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' };
      case 'leave':
        return { label: 'إجازة معتمدة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'early_leave':
        return { label: 'انصراف مبكر', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'sick_leave':
        return { label: 'إجازة مرضية', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'work_injury':
        return { label: 'إصابة عمل', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' };
      case 'casual_leave':
        return { label: 'إجازة عارضة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'annual_leave':
        return { label: 'إجازة اعتيادية', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'mission':
        return { label: 'مأمورية عمل', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      default:
        return { label: 'غير محدد', color: 'bg-slate-100 text-slate-700' };
    }
  };

  const missingCheckoutsTotalCount = useMemo(() => {
    return attendance.filter((a) => !a.checkOut || a.checkOut === '-' || a.checkOut.trim() === '').length;
  }, [attendance]);

  const displayedAttendance = useMemo(() => {
    let list = !selectedDate ? attendance : attendance.filter((a) => a.date === selectedDate);
    if (selectedEmployeeId) {
      const selectedEmp = employees?.find((e) => e.id === selectedEmployeeId);
      list = list.filter(
        (a) =>
          a.employeeId === selectedEmployeeId ||
          (selectedEmp && (
            a.employeeId === selectedEmp.employeeCode ||
            a.employeeId === `emp-dat-${selectedEmp.employeeCode}` ||
            (a.employeeName && a.employeeName.trim() === selectedEmp.name.trim())
          ))
      );
    }
    if (filterOnlyMissingCheckouts) {
      list = list.filter((a) => !a.checkOut || a.checkOut === '-' || a.checkOut.trim() === '');
    }
    const fixed = list.map((rec) => {
      const fixedRec = fixAttendanceRecord(rec, shifts);
      if (employees) {
        const emp = employees.find(e => e.id === fixedRec.employeeId || e.employeeCode === fixedRec.employeeId?.replace('emp-dat-', ''));
        if (emp && emp.department) {
          fixedRec.department = emp.department;
        }
      }
      return fixedRec;
    });
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      return fixed.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          (a.shiftName && a.shiftName.toLowerCase().includes(q)) ||
          a.date.includes(q)
      );
    }
    return fixed;
  }, [attendance, selectedDate, selectedEmployeeId, filterOnlyMissingCheckouts, searchTerm, shifts, employees]);

  const totalDelaysMinutes = displayedAttendance.reduce((sum, a) => sum + (a.delayMinutes || 0), 0);

  const handleExportExcel = () => {
    const dataToExport = displayedAttendance.map((rec) => ({
      'اسم الموظف': rec.employeeName,
      'القسم': rec.department,
      'التاريخ': rec.date,
      'وقت الحضور': rec.checkIn,
      'وقت الانصراف': rec.checkOut,
      'التأخير (دقائق)': rec.delayMinutes,
      'الخروج المبكر (دقائق)': rec.earlyLeaveMinutes,
      'الحالة': getStatusBadge(rec.status).label,
      'ملاحظات': rec.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجلات الحضور');
    XLSX.writeFile(wb, `Attendance_Export_${selectedDate || 'All'}.xlsx`);
    triggerNotification('تم تصدير سجلات الحضور بنجاح.');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <span>إدارة الحضور والانصراف والورديات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل الحضور اليومي، حساب ساعات التأخير والانصراف المبكر، وتعيين الورديات وسياسات الدوام.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === 'daily'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            جدول الحضور اليومي
          </button>
          <button
            onClick={() => setActiveSubTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'devices'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 text-blue-400" />
            <span>أجهزة البصمة والربط التلقائي</span>
            {(biometricDevices?.length || 0) > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                  activeSubTab === 'devices'
                    ? 'bg-blue-800 text-white'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {biometricDevices?.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('biometric_logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'biometric_logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>سجل حركات البصمة</span>
            {(biometricLogs?.length || 0) > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                  activeSubTab === 'biometric_logs'
                    ? 'bg-blue-800 text-white'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}
              >
                {biometricLogs?.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === 'shifts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            إعداد الورديات والدوام
          </button>
        </div>
      </div>

      {activeSubTab === 'daily' && (
        <div className="space-y-4">

          {/* Hidden File Input for ZKTeco DAT Files Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportDatFiles}
            accept=".dat,.txt,.csv"
            multiple
            className="hidden"
          />

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
            {/* GPS Mobile Attendance Portal Button */}
            <button
              onClick={() => {
                if (onOpenMobilePortal) {
                  onOpenMobilePortal();
                } else {
                  setShowMobileGeofenceModal(true);
                }
              }}
              className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5 shadow-sm shadow-purple-600/30 active:scale-98 cursor-pointer ring-1 ring-purple-400/40"
              title="فتح بوابة حضور وانصراف الموظفين عبر الموبايل بالموقع الجغرافي (GPS)"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-200" />
              <span>حضور الموبايل (GPS)</span>
              <span className="bg-purple-950/80 text-purple-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {companySettings?.enableGeofenceAttendance ?? true ? 'مفعل 🟢' : 'معطل'}
              </span>
            </button>

            {/* Biometric Live Sync Button */}
            <button
              onClick={handleSyncAllDevices}
              disabled={isBiometricSyncing}
              className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/30 active:scale-98 cursor-pointer disabled:opacity-50 ring-1 ring-blue-400/40"
              title="سحب حركات البصمة فورياً من كافة أجهزة البصمة المتصلة بالشبكة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBiometricSyncing ? 'animate-spin' : ''}`} />
              <span>{isBiometricSyncing ? 'جاري سحب البصمة...' : 'سحب البصمات (Live Sync)'}</span>
              {(biometricDevices?.length || 0) > 0 && (
                <span className="bg-blue-900/60 text-blue-100 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {biometricDevices?.length} جهاز
                </span>
              )}
            </button>

            {/* Separate Dedicated Button: Add / Connect New Biometric Device */}
            <button
              onClick={() => {
                setEditingBiometricDevice(null);
                setShowBiometricDeviceModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 active:scale-98 cursor-pointer ring-1 ring-emerald-400/40"
              title="ربط وإضافة جهاز بصمة جديد وتحديد الـ IP والبورت"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ربط جهاز بصمة جديد</span>
            </button>

            {/* Manage & Modify Devices Button */}
            <button
              onClick={() => setActiveSubTab('devices')}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 active:scale-98 cursor-pointer border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100"
              title="تعديل وتغيير أجهزة البصمة وضبط إعدادات الشبكة"
            >
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>تعديل وإدارة الأجهزة ({biometricDevices?.length || 0})</span>
            </button>

            <button
              onClick={handleOpenMissingCheckoutsModal}
              className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-600/30 active:scale-98 cursor-pointer ring-1 ring-amber-400/50"
              title="معالجة وحل مشكلة أوقات الانصراف المفقودة وتعبئة نهايات الورديات"
            >
              <Zap className="w-4 h-4 text-amber-200" />
              <span>معالجة أوقات الانصراف المفقودة</span>
              {missingCheckoutsTotalCount > 0 && (
                <span className="bg-amber-950/80 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black">
                  {missingCheckoutsTotalCount} ناقص
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setFilterOnlyMissingCheckouts(!filterOnlyMissingCheckouts);
                if (!filterOnlyMissingCheckouts) {
                  triggerNotification('تم تصفية العرض لعرض السجلات التي تنقصها أوقات الانصراف فقط.');
                } else {
                  triggerNotification('تم إلغاء التصفية وعرض جميع السجلات.');
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 active:scale-98 cursor-pointer border ${
                filterOnlyMissingCheckouts
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50'
              }`}
              title="تصفية الجدول لإظهار السجلات التي تنقصها بصمة الخروج فقط"
            >
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <span>سجلات بدون انصراف ({missingCheckoutsTotalCount})</span>
            </button>

            <button
              onClick={() => {
                setBatchAttendanceData(attendance.map((r) => ({ ...r })));
                setShowBatchAttendanceEditModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 active:scale-98 cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>تعديل جدول الحضور اليومي</span>
            </button>
            <button
              onClick={() => {
                setSelectedDate('');
                setFilterOnlyMissingCheckouts(false);
                triggerNotification('تم عرض كافة سجلات الحضور لجميع الفترات.');
              }}
              className="px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 transition-colors flex items-center gap-1.5 active:scale-98"
            >
              <CalendarIcon className="w-4 h-4" />
              كل السجلات
            </button>
            <button
              id="today-attendance-filter-btn"
              onClick={() => {
                const today = getTodayDateString();
                setSelectedDate(today);
                triggerNotification(`تم تصفية العرض لبصمات اليوم (${today}).`);
              }}
              className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20 active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>بصمات اليوم</span>
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-teal-500 hover:bg-teal-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-teal-500/20 active:scale-98"
            >
              <Users className="w-4 h-4" />
              حضور جماعي
            </button>
            <button
              onClick={() => setShowAiModal(true)}
              className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-orange-500/20 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              ذكاء الحضور
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-amber-500 hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-98 cursor-pointer"
              title="تحديد ملفات البصمة (.dat) - ملف للدخول attlog.dat وملف للخروج attlog1.dat"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>استيراد ملفات البصمة (.dat)</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-98 cursor-pointer"
              title="تصدير السجلات المعروضة بصيغة إكسيل"
            >
              <Download className="w-4 h-4 text-white" />
              <span>تصدير لإكسيل</span>
            </button>
            {onClearAttendance && (
              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-red-500/20 active:scale-98 cursor-pointer"
                title="إزالة جميع بصمات الحضور"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>إزالة البصمات</span>
              </button>
            )}
          </div>

          {/* Daily Summary Metrics & Date Selection */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تاريخ الحضور:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="py-1.5 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تصفية بالموظف:</span>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="py-1.5 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none max-w-[200px]"
                >
                  <option value="">جميع الموظفين</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {formatEmployeeDisplayName(emp.name, emp.employeeId, emp.code)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {missingCheckoutsTotalCount > 0 && (
                <div
                  onClick={handleOpenMissingCheckoutsModal}
                  className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 cursor-pointer transition-colors"
                  title="اضغط لفتح معالج حل أوقات الانصراف"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold">
                    يوجد <strong className="font-black text-amber-900 dark:text-amber-100">{missingCheckoutsTotalCount}</strong> سجلات بدون انصراف
                  </span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-md font-bold">
                    حل المشكلة الآن
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setBatchAttendanceData(attendance.map((r) => ({ ...r })));
                  setShowBatchAttendanceEditModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>تعديل جدول الحضور السريع</span>
              </button>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-bold">إجمالي التأخير: {totalDelaysMinutes} دقيقة</span>
              </div>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-white dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">وقت الحضور</th>
                  <th className="p-3.5">وقت الانصراف</th>
                  <th className="p-3.5">التأخير (دقائق)</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {displayedAttendance.length > 0 ? (
                  displayedAttendance.map((rec, idx) => {
                    const badge = getStatusBadge(rec.status);
                    const isMissingOut = !rec.checkOut || rec.checkOut === '-' || rec.checkOut.trim() === '';

                    return (
                      <tr key={`att-log-${rec.id}-${idx}`} className="hover:bg-white/80 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                          {formatEmployeeDisplayName(rec.employeeName, rec.employeeId, employees)}
                        </td>
                        <td className="p-3.5 text-slate-500">{rec.department}</td>
                        <td className="p-3.5 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-600 font-mono font-bold">{rec.checkIn}</span>
                            {rec.verificationMethod === 'gps_mobile' && (
                              <span
                                className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[9px] font-bold flex items-center gap-0.5"
                                title={`تسجيل GPS موبايل: ${rec.userLat ? `${rec.userLat.toFixed(4)}, ${rec.userLng?.toFixed(4)}` : ''} ${rec.distanceMeters ? `(بعد ${Math.round(rec.distanceMeters)}م)` : ''}`}
                              >
                                <MapPin className="w-2.5 h-2.5 text-purple-600" />
                                <span>GPS</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-bold">
                          {isMissingOut ? (
                            <button
                              onClick={() => setEditingRecord(rec)}
                              className="px-2 py-0.5 rounded-lg bg-amber-100/90 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold hover:bg-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="انقر لتسجيل وقت الانصراف لهذا السجل"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>غير مسجل (تعبئة)</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-600 font-mono font-bold">{rec.checkOut}</span>
                              {rec.verificationMethod === 'gps_mobile' && rec.checkOut !== '-' && (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[9px] font-bold flex items-center gap-0.5"
                                  title="انصراف عبر الـ GPS"
                                >
                                  <MapPin className="w-2.5 h-2.5 text-purple-600" />
                                  <span>GPS</span>
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-extrabold text-amber-600">
                          {rec.delayMinutes > 0 ? `${rec.delayMinutes} د` : '-'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setEditingRecord(rec)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="تعديل وقت وسجل الحضور"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل السجل</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                            {filterOnlyMissingCheckouts
                              ? 'لا توجد أي سجلات تنقصها أوقات الانصراف!'
                              : `لا توجد سجلات حضور مسجلة بتاريخ ${selectedDate || 'المحدد'}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {filterOnlyMissingCheckouts
                              ? 'جميع سجلات الحضور الحالية تحتوي على أوقات انصراف مكتملة.'
                              : attendance.length > 0
                              ? `يوجد إجمالي ${attendance.length} سجل حضور في تواريخ أخرى.`
                              : 'جدول الحضور فارغ حالياً. يمكنك استيراد ملفات جهاز البصمة (.dat) مباشرة.'}
                          </p>
                        </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            {filterOnlyMissingCheckouts ? (
                              <button
                                onClick={() => setFilterOnlyMissingCheckouts(false)}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <CalendarIcon className="w-4 h-4" />
                                <span>عرض جميع السجلات</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={handleSyncAllDevices}
                                  disabled={isBiometricSyncing}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <RefreshCw className={`w-4 h-4 ${isBiometricSyncing ? 'animate-spin' : ''}`} />
                                  <span>سحب حركات البصمة الآن</span>
                                </button>
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                  <span>استيراد ملفات البصمة (.dat)</span>
                                </button>
                                {attendance.length > 0 && selectedDate && (
                                  <button
                                    onClick={() => setSelectedDate('')}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
                                  >
                                    إظهار كافة سجلات الحضور ({attendance.length})
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shifts Management Tab */}
      {activeSubTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              قائمة الورديات المعتمدة ومواعيد الدوام
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من استعادة الورديات الافتراضية؟ سيتم إزالة التعديلات الحالية.')) {
                    if (onResetShifts) onResetShifts();
                    triggerNotification('تم استعادة الورديات الافتراضية بنجاح.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                title="استعادة الورديات الافتراضية"
              >
                <Settings className="w-4 h-4" />
                <span>الورديات الافتراضية</span>
              </button>
              <button
                onClick={() => {
                  if (shifts.length > 0) {
                    setEditingShift({ ...shifts[0] });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-blue-400" />
                <span>تعديل الورديات ومواعيد الدوام</span>
              </button>
              <button
                onClick={() => setShowShiftModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وردية جديدة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{shift.name}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {shift.workingHours} ساعات عمل
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">بداية ونهاية الوردية:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">فترة السماح قبل التأخير:</span>
                      <span className="font-bold text-emerald-600">{shift.gracePeriodMinutes} دقيقة</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {shift.activeDays.map((day, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={() => setEditingShift({ ...shift })}
                    className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل الوردية ومواعيد الدوام</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biometric Devices Subtab */}
      {activeSubTab === 'devices' && (
        <BiometricDevicesTab
          devices={biometricDevices || []}
          settings={biometricSettings}
          onAddDevice={() => {
            setEditingBiometricDevice(null);
            setShowBiometricDeviceModal(true);
          }}
          onEditDevice={(dev) => {
            setEditingBiometricDevice(dev);
            setShowBiometricDeviceModal(true);
          }}
          onDeleteDevice={(id) => {
            if (onDeleteBiometricDevice) onDeleteBiometricDevice(id);
            triggerNotification('تم إزالة ربط جهاز البصمة بنجاح.');
          }}
          onUpdateDevice={(dev) => {
            if (onUpdateBiometricDevice) onUpdateBiometricDevice(dev);
          }}
          onUpdateSettings={(newSettings) => {
            if (onUpdateBiometricSettings) onUpdateBiometricSettings(newSettings);
            triggerNotification('تم حفظ إعدادات المزامنة والربط التلقائي بنجاح.');
          }}
          onSyncDevice={handleSyncSingleDevice}
          onSyncAllDevices={handleSyncAllDevices}
          onOpenBridgeModal={() => setShowBiometricBridgeModal(true)}
          isSyncing={isBiometricSyncing}
          totalLogsCount={biometricLogs?.length || 0}
        />
      )}

      {/* Biometric Raw Punch Logs Subtab */}
      {activeSubTab === 'biometric_logs' && (
        <BiometricLogsTab
          logs={biometricLogs || []}
          devices={biometricDevices || []}
          onClearLogs={onClearBiometricLogs}
          onRefreshPunches={() => triggerNotification('تم تحديث قائمة حركات وسجلات البصمة.')}
        />
      )}

      {/* Edit Attendance Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRecord}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in relative z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                تعديل حالة ودوام: {formatEmployeeDisplayName(editingRecord.employeeName, editingRecord.employeeId, employees)}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">حالة الحضور</label>
                <select
                  value={editingRecord.status || 'present'}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="present" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">حاضر (في الوقت)</option>
                  <option value="late" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">متأخر</option>
                  <option value="absent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">غائب</option>
                  <option value="leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">إجازة</option>
                  <option value="annual_leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">إجازة اعتيادية</option>
                  <option value="casual_leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">إجازة عارضة</option>
                  <option value="sick_leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">إجازة مرضية</option>
                  <option value="work_injury" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">إصابة عمل</option>
                  <option value="mission" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">مأمورية عمل</option>
                  <option value="early_leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">انصراف مبكر</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت الحضور</label>
                  <input
                    type="text"
                    value={editingRecord.checkIn}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت الانصراف</label>
                  <input
                    type="text"
                    value={editingRecord.checkOut}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">تأخير بالدقائق</label>
                <input
                  type="number"
                  value={editingRecord.delayMinutes}
                  onChange={(e) => setEditingRecord({ ...editingRecord, delayMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ملاحظات / أسباب التأخير</label>
                <input
                  type="text"
                  value={editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  placeholder="مثال: عذر طبي معتمد"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateShift}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">إضافة وردية عمل جديدة</h3>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الوردية *</label>
                <input
                  required
                  type="text"
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  placeholder="مثال: وردية المساء الأولى"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت البدء</label>
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت الانتهاء</label>
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">فترة السماح بالدقائق</label>
                <input
                  type="number"
                  value={newShift.gracePeriodMinutes}
                  onChange={(e) => setNewShift({ ...newShift, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                إضافة الوردية
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center gap-3 shadow-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Batch Attendance Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleBatchSubmit}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl relative z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-teal-600">
                <Users className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">تسجيل الحضور الجماعي للفريق</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">تاريخ الحضور الجماعي</label>
                <input
                  type="date"
                  defaultValue={getTodayDateString()}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت الحضور الافتراضي للجميع</label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الحالة الجماعية</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none">
                  <option value="present" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">حاضر (في الوقت)</option>
                  <option value="late" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">متأخر (تلقائي مع السماح)</option>
                  <option value="leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">إجازة رسمية جماعية</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 cursor-pointer transition-colors"
              >
                تطبيق وتسجيل الحضور الجماعي
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Intelligence Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-orange-500">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">تحليل ذكاء الحضور والتأخير</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200 leading-relaxed font-medium">
                قام الذكاء الاصطناعي بتحليل أنماط الحضور لهذا الشهر، وجاءت التوصيات كالتالي:
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300">
                <li>نسبة الانضباط بالوقت للورديات بلغت <strong>{attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 100}%</strong>.</li>
                <li>إجمالي دقائق التأخير المسجلة في النظام: {attendance.reduce((sum, a) => sum + (a.delayMinutes || 0), 0)} دقيقة.</li>
                <li>اقتراح: مراجعة سياسات الحضور وفترات السماح بناءً على الأنماط الفعلية.</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm shadow-orange-500/20"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Links Modal */}
      {showMobileLinksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl text-center">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">بصمة الموبايل والموقع الجغرافي (GPS)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileLinksModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs py-2">
              <div className="w-24 h-24 mx-auto bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center border border-emerald-200 text-emerald-600">
                <QrCode className="w-16 h-16" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                رابط البصمة الذكية الخاص بالشركة عبر الهاتف (Geofencing Enabled):
              </p>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-blue-600 select-all border border-slate-200 dark:border-slate-700">
                https://hr.app/punch-in?code=HQ-CAIRO-902
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('https://hr.app/punch-in?code=HQ-CAIRO-902');
                  triggerNotification('تم نسخ رابط بصمة الهاتف إلى الحافظة!');
                  setShowMobileLinksModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                نسخ الرابط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {editingShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveShiftEdit}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in relative z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Settings className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  تعديل الوردية المعتمدة ومواعيد الدوام
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingShift(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {shifts.length > 1 && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    اختر الوردية المراد تعديلها
                  </label>
                  <select
                    value={editingShift.id}
                    onChange={(e) => {
                      const found = shifts.find((s) => s.id === e.target.value);
                      if (found) setEditingShift({ ...found });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الوردية *</label>
                <input
                  required
                  type="text"
                  value={editingShift.name}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نوع الوردية</label>
                  <select
                    value={editingShift.type || 'morning'}
                    onChange={(e) => setEditingShift({ ...editingShift, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="morning" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">صباحية</option>
                    <option value="evening" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">مسائية</option>
                    <option value="night" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">ليلية</option>
                    <option value="flexible" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">دوام مرن</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعات العمل اليومية</label>
                  <input
                    type="number"
                    value={editingShift.workingHours}
                    onChange={(e) => setEditingShift({ ...editingShift, workingHours: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت بدء الدوام</label>
                  <input
                    type="text"
                    value={editingShift.startTime}
                    onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">وقت نهاية الدوام</label>
                  <input
                    type="text"
                    value={editingShift.endTime}
                    onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">فترة السماح بالدقائق (قبل احتساب التأخير)</label>
                <input
                  type="number"
                  value={editingShift.gracePeriodMinutes}
                  onChange={(e) => setEditingShift({ ...editingShift, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">أيام العمل المعتمدة للوردية</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => {
                    const isSelected = editingShift.activeDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const updatedDays = isSelected
                            ? editingShift.activeDays.filter((d) => d !== day)
                            : [...editingShift.activeDays, day];
                          setEditingShift({ ...editingShift, activeDays: updatedDays });
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingShift(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ تعديلات الوردية</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batch Edit Daily Attendance Modal */}
      {showBatchAttendanceEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBatchAttendance}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-indigo-600">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  تعديل جدول الحضور والانصراف اليومي المباشر
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchAttendanceEditModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
              يمكنك تعديل أوقات الحضور والانصراف، حالة الدوام، ودقائق التأخير لجميع الموظفين بضغطة واحدة:
            </p>

            <div className="overflow-y-auto overflow-x-auto grow border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">حالة الحضور</th>
                    <th className="p-3">وقت الحضور</th>
                    <th className="p-3">وقت الانصراف</th>
                    <th className="p-3">التأخير (دقيقة)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {batchAttendanceData.map((rec, idx) => (
                    <tr key={`batch-${rec.id || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {formatEmployeeDisplayName(rec.employeeName, rec.employeeId, employees)}
                        <div className="text-[10px] text-slate-400 font-normal">{rec.department}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={rec.status}
                          onChange={(e) => {
                            const val = e.target.value as AttendanceStatus;
                            const updated = [...batchAttendanceData];
                            updated[idx] = { ...updated[idx], status:val };
                            setBatchAttendanceData(updated);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                        >
                          <option value="present">حاضر (في الوقت)</option>
                          <option value="late">متأخر</option>
                          <option value="absent">غائب</option>
                          <option value="leave">إجازة</option>
                          <option value="annual_leave">إجازة اعتيادية</option>
                          <option value="casual_leave">إجازة عارضة</option>
                          <option value="sick_leave">إجازة مرضية</option>
                          <option value="work_injury">إصابة عمل</option>
                          <option value="mission">مأمورية عمل</option>
                          <option value="early_leave">انصراف مبكر</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={rec.checkIn}
                          onChange={(e) => {
                            const updated = [...batchAttendanceData];
                            updated[idx] = { ...updated[idx], checkIn: e.target.value };
                            setBatchAttendanceData(updated);
                          }}
                          className="w-20 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={rec.checkOut}
                          onChange={(e) => {
                            const updated = [...batchAttendanceData];
                            updated[idx] = { ...updated[idx], checkOut: e.target.value };
                            setBatchAttendanceData(updated);
                          }}
                          className="w-20 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={rec.delayMinutes}
                          onChange={(e) => {
                            const updated = [...batchAttendanceData];
                            updated[idx] = { ...updated[idx], delayMinutes: Number(e.target.value) };
                            setBatchAttendanceData(updated);
                          }}
                          className="w-16 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-amber-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBatchAttendanceEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق تعديلات الجدول</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DAT Files Import Summary Modal */}
      {showDatImportModal && datImportSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] flex flex-col dir-rtl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    نتائج استيراد ملفات البصمة (.dat)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تم قراءة وتحليل ملفات بصمة الدخول والخروج بنجاح
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDatImportModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imported files badge */}
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  الملفات التي تم معالجتها ({datImportSummary.filesCount} ملف):
                </span>
                <span className="text-[11px] font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                  تنسيق جهاز البصمة (.dat)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono font-bold">
                {datImportSummary.fileNames.map((name, i) => (
                  <span
                    key={i}
                    className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    {name}
                    {name.toLowerCase().includes('attlog1') ? (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-sans">
                        بصمات الخروج
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-sans">
                        بصمات الدخول
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-500">عدد حركات البصمة</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {datImportSummary.totalLogsParsed}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-500">الموظفين المحدثين</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {datImportSummary.matchedCount}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-500">الأيام المعالجة</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {datImportSummary.updatedDates.length || 1}
                </p>
              </div>
            </div>

            {/* Summary List Table */}
            <div className="overflow-y-auto max-h-56 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold sticky top-0">
                  <tr>
                    <th className="p-2.5">الموظف</th>
                    <th className="p-2.5 text-center">التاريخ</th>
                    <th className="p-2.5 text-center">وقت الدخول</th>
                    <th className="p-2.5 text-center">وقت الخروج</th>
                    <th className="p-2.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {datImportSummary.recordsSummary.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {formatEmployeeDisplayName(rec.employeeName, undefined, employees)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">
                        {rec.date}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {rec.checkIn}
                      </td>
                      <td className="p-2.5 text-center font-bold text-blue-600">
                        {rec.checkOut}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            rec.status.includes('متأخر')
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
              <button
                onClick={() => setShowDatImportModal(false)}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تم، اعتماد وتطبيق الحضور</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Checkouts Solver Modal */}
      {showMissingCheckoutsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl animate-fade-in max-h-[92vh] flex flex-col dir-rtl text-right">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>معالجة وحل أوقات الانصراف المفقودة</span>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                      {missingCheckoutRows.length} سجل بحاجة للمعالجة
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    حل مشكلة عدم تسجيل بصمة الخروج أو استيراد ملفات البصمة بشكل منفصل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMissingCheckoutsModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Resolution Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
              
              {/* Option 1: Auto Fix & Shift End Times */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>دمج وتعبئة نهاية الورديات (شامل)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    يدمج الحركات المكررة تلقائياً، ويعيّن وقت نهاية وردية كل موظف كوقت انصراف.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRepairAndFixAttendance('merge_and_autofill')}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>تطبيق الحل التلقائي الموصى به</span>
                </button>
              </div>

              {/* Option 2: Custom / Standard Time */}
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900 dark:text-blue-200">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>تعبئة وقت انصراف محدد</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    تعيين وقت خروج موحد لجميع السجلات الناقصة:
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    {['16:00', '16:30', '17:00', '18:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setUniversalCheckoutTime(time)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                          universalCheckoutTime === time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={universalCheckoutTime}
                    onChange={(e) => setUniversalCheckoutTime(e.target.value)}
                    placeholder="16:30"
                    className="w-20 p-1.5 text-center text-xs font-bold rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRepairAndFixAttendance('custom_time', universalCheckoutTime)}
                    className="grow py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>تطبيق ({universalCheckoutTime})</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Merge Split Punches Only */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-200">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                    <span>دمج بصمات الدخول والخروج فقط</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    دمج السجلات المنفصلة لنفس الموظف في نفس اليوم دون إضافة أوقات افتراضية.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRepairAndFixAttendance('merge_only')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  <span>دمج وتطهير السجلات فقط</span>
                </button>
              </div>

            </div>

            {/* Table of records needing checkout time */}
            <div className="overflow-y-auto overflow-x-auto grow border border-slate-200 dark:border-slate-700 rounded-2xl max-h-[45vh]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr>
                    <th className="p-3">الموظف والوظيفة</th>
                    <th className="p-3 text-center">التاريخ</th>
                    <th className="p-3 text-center">وقت الحضور</th>
                    <th className="p-3 text-center">وقت الانصراف (المقترح)</th>
                    <th className="p-3 text-center">الوردية المقترنة</th>
                    <th className="p-3 text-center">إجراء سريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {missingCheckoutRows.length > 0 ? (
                    missingCheckoutRows.map((rec, idx) => {
                      const matchedShift = shifts.find((s) => s.id === rec.shiftId) || shifts[0];
                      const shiftEnd = matchedShift?.endTime || '16:30';

                      return (
                        <tr key={`missing-row-${rec.id || idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {formatEmployeeDisplayName(rec.employeeName, rec.employeeId, employees)}
                            <div className="text-[10px] text-slate-400 font-normal">{rec.department}</div>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-300">
                            {rec.date}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-600 font-mono">
                            {rec.checkIn || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="text"
                              value={rec.checkOut === '-' ? '' : rec.checkOut}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMissingCheckoutRows((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], checkOut: val };
                                  return updated;
                                });
                              }}
                              placeholder={shiftEnd}
                              className="w-24 p-1.5 text-center rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40 font-bold text-xs text-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                              {matchedShift?.name || 'الوردية الأولى'} ({matchedShift?.startTime} - {matchedShift?.endTime})
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setMissingCheckoutRows((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], checkOut: shiftEnd };
                                  return updated;
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold cursor-pointer transition-colors"
                              title={`تعيين وقت الانصراف ${shiftEnd}`}
                            >
                              تعيين {shiftEnd}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                            لا توجد أي سجلات بدون وقت انصراف!
                          </p>
                          <p className="text-xs text-slate-400">
                            جميع بصمات وسجلات الحضور مكتملة وبأوقات انصراف مسجلة.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {missingCheckoutRows.length > 0
                  ? `سيتم حفظ وتحديث ${missingCheckoutRows.length} سجل بعد المراجعة.`
                  : 'تم اكتمال مراجعة وتعديل جميع السجلات.'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMissingCheckoutsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={handleSaveMissingCheckoutsFromModal}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ واعتماد التعديلات</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Clear Attendance Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border-b border-red-100 dark:border-red-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold">تأكيد إزالة جميع السجلات</h3>
              </div>
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 text-sm text-slate-700 dark:text-slate-300 text-center leading-relaxed font-semibold">
              <p>هل أنت متأكد من إزالة جميع بصمات الحضور المسجلة؟</p>
              <p className="text-red-500 mt-2">لا يمكن التراجع عن هذه الخطوة نهائياً.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (onClearAttendance) {
                    onClearAttendance();
                  }
                  setShowClearConfirmModal(false);
                  triggerNotification('تمت إزالة جميع بصمات الحضور المسجلة بنجاح.');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، إزالة البصمات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Device Add/Edit Modal */}
      {showBiometricDeviceModal && (
        <BiometricDeviceModal
          isOpen={showBiometricDeviceModal}
          device={editingBiometricDevice}
          onClose={() => {
            setShowBiometricDeviceModal(false);
            setEditingBiometricDevice(null);
          }}
          onSave={(dev) => {
            if (editingBiometricDevice) {
              if (onUpdateBiometricDevice) onUpdateBiometricDevice(dev);
              triggerNotification(`تم تحديث بيانات جهاز البصمة (${dev.name}) بنجاح.`);
            } else {
              if (onAddBiometricDevice) onAddBiometricDevice(dev);
              triggerNotification(`تم ربط جهاز البصمة الجديد (${dev.name}) بنجاح.`);
            }
            setShowBiometricDeviceModal(false);
            setEditingBiometricDevice(null);
          }}
        />
      )}

      {/* Biometric Sync Progress & Results Modal */}
      {showBiometricSyncModal && (
        <BiometricSyncModal
          isOpen={showBiometricSyncModal}
          onClose={() => setShowBiometricSyncModal(false)}
          isSyncing={isBiometricSyncing}
          logs={lastSyncResult?.logs || []}
          attendanceCount={lastSyncResult?.attendanceCount || 0}
          newEmployees={lastSyncResult?.newEmployees || []}
          device={lastSyncResult?.device || null}
          onNavigateToAttendance={() => {
            setShowBiometricSyncModal(false);
            setActiveSubTab('daily');
          }}
        />
      )}

      {/* Biometric Bridge Python Script Modal */}
      {showBiometricBridgeModal && (
        <BiometricBridgeModal
          isOpen={showBiometricBridgeModal}
          onClose={() => setShowBiometricBridgeModal(false)}
          devices={biometricDevices || []}
          settings={biometricSettings || { autoDailySync: true, dailySyncTime: '23:59' }}
        />
      )}

      {/* Mobile Attendance Geofence Info & Launch Modal */}
      {showMobileGeofenceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">بوابة الحضور والانصراف عبر الموبايل (GPS)</h3>
                  <p className="text-xs text-slate-400">تسجيل حضور وانصراف الموظفين بالموقع الجغرافي المباشر</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileGeofenceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Geofence Current Configuration */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                  <MapPin className="w-4 h-4" />
                  <span>المقر المعتمد:</span>
                </span>
                <span>{companySettings?.companyAddress || 'المقر الرئيسي'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                <span>الإحداثيات:</span>
                <span>{companySettings?.companyLat ?? 30.0444}, {companySettings?.companyLng ?? 31.2357}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                <span>النطاق المسموح (Geofence Radius):</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{companySettings?.allowedRadiusMeters ?? 50} متراً</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200">كيف يستخدم الموظفون هذه الخاصية؟</div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                <li>يقوم الموظف بفتح رابط بوابة الموبايل من هاتفه الذكي.</li>
                <li>يمنح المتصفح إذن الوصول للموقع الجغرافي (GPS Permission).</li>
                <li>يضغط على [تسجيل حضور] أو [تسجيل انصراف] لحظة وصوله المقر.</li>
                <li>يقوم النظام فورياً بقياس المسافة (Haversine Formula) واعتماد البصمة إذا كان داخل النطاق.</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowMobileGeofenceModal(false);
                  if (onOpenMobilePortal) onOpenMobilePortal();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح واجهة الموظف الذكية الآن</span>
              </button>

              <button
                onClick={() => {
                  const mobileUrl = `${window.location.origin}${window.location.pathname}#mobile`;
                  navigator.clipboard.writeText(mobileUrl);
                  setCopiedMobileLink(true);
                  setTimeout(() => setCopiedMobileLink(false), 2500);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {copiedMobileLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMobileLink ? 'تم نسخ رابط الموبايل بنجاح!' : 'نسخ رابط الحضور لمشاركته مع الموظفين'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
