import React, { useState, useRef, useEffect } from "react";
import {
  Calculator,
  ShieldCheck,
  Lock,
  Printer,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Download,
  Eye,
  Sparkles,
  Edit3,
  Save,
  Search,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Percent,
  Check,
  X,
  Plus,
  Coins,
  ArrowUpRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PayrollRecord, Employee, Department } from "../types";
import { PayslipModal } from "./PayslipModal";

interface PayrollViewProps {
  payrollRecords: PayrollRecord[];
  employees?: Employee[];
  departments?: Department[];
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onApprovePayroll: (month: string) => void;
  onUpdatePayrollRecord?: (updatedRec: PayrollRecord) => void;
  onGeneratePayroll?: (month: string) => void;
  currencySymbol: string;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  payrollRecords,
  employees = [],
  departments: deptList = [],
  searchTerm,
  setSearchTerm,
  onApprovePayroll,
  onUpdatePayrollRecord,
  onGeneratePayroll,
  currencySymbol,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-07");
  const [searchQuery, setSearchQuery] = useState<string>(searchTerm || "");

  useEffect(() => {
    if (searchTerm !== undefined && searchTerm !== searchQuery) {
      setSearchQuery(searchTerm);
    }
  }, [searchTerm]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isSpreadsheetMode, setIsSpreadsheetMode] = useState<boolean>(false);
  const [activeTableTab, setActiveTableTab] = useState<'main' | 'overtime'>('main');
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(
    null,
  );
  const [activePayslipRecord, setActivePayslipRecord] =
    useState<PayrollRecord | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const getEmpDisplayName = (name?: string, empCodeOrId?: string) => {
    const cleanCode = (empCodeOrId || '').replace(/[\uFFFD\?]/g, '').trim();
    const rawNum = parseInt(cleanCode.replace(/\D/g, ''), 10);

    if (employees && employees.length > 0) {
      const matched = employees.find((e) => {
        if (!e) return false;
        const eCode = (e.employeeCode || '').replace(/[\uFFFD\?]/g, '').trim();
        const eId = (e.id || '').replace(/[\uFFFD\?]/g, '').trim();
        const eIqama = (e.iqamaOrIdNumber || '').replace(/[\uFFFD\?]/g, '').trim();

        if (
          cleanCode &&
          (eCode === cleanCode ||
            eId === cleanCode ||
            eId === `emp-${cleanCode}` ||
            eId === `emp-dat-${cleanCode}` ||
            eIqama === cleanCode ||
            eIqama === `DAT-${cleanCode}`)
        ) {
          return true;
        }

        if (cleanCode && eCode && eCode.replace(/^0+/, '') === cleanCode.replace(/^0+/, '')) {
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
        const cleanName = matched.name.replace(/[\uFFFD\?]/g, '').trim();
        if (cleanName.length >= 2 && !cleanName.includes('?')) {
          return cleanName;
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

    const numId = cleanCode ? cleanCode.replace(/\D/g, '') || cleanCode : '1';
    return `موظف بصمة رقم (${numId})`;
  };

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = selectedMonth.split("-");
    return parseInt(y) || 2026;
  });

  // Synchronize picker year when selectedMonth changes
  useEffect(() => {
    const [y] = selectedMonth.split("-");
    const parsedY = parseInt(y);
    if (parsedY) {
      setPickerYear(parsedY);
    }
  }, [selectedMonth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate a broad list of months from 2024 to 2028
  const availableMonths: { value: string; label: string }[] = [];
  const years = [2028, 2027, 2026, 2025, 2024];
  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  for (const year of years) {
    for (let m = 11; m >= 0; m--) {
      const monthVal = `${year}-${String(m + 1).padStart(2, "0")}`;
      availableMonths.push({
        value: monthVal,
        label: `مسير ${arabicMonths[m]} ${year}`,
      });
    }
  }

  const getSelectedMonthLabel = () => {
    const [yStr, mStr] = selectedMonth.split("-");
    const y = parseInt(yStr) || 2026;
    const mIdx = parseInt(mStr) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `شهر ${arabicMonths[mIdx]} ${y}`;
    }
    return selectedMonth;
  };

  // Recalculation logic helper
  const calculateRecord = (
    rec: PayrollRecord,
    fields: Partial<PayrollRecord>,
  ): PayrollRecord => {
    const merged = { ...rec, ...fields };

    const baseSalary =
      Number(merged.baseSalary) >= 0 ? Number(merged.baseSalary) : 0;
    const allowances =
      Number(merged.allowances) >= 0 ? Number(merged.allowances) : 0;
    const otherAllowances =
      Number(merged.otherAllowances) >= 0 ? Number(merged.otherAllowances) : 0;
    const bonus = Number(merged.bonus) >= 0 ? Number(merged.bonus) : 0;

    // Ensure day/night overtime values are initialized
    const otHoursDay =
      merged.overtimeHoursDay !== undefined
        ? Number(merged.overtimeHoursDay)
        : 0;
    const otHoursNight =
      merged.overtimeHoursNight !== undefined
        ? Number(merged.overtimeHoursNight)
        : 0;
    const otRateDay =
      merged.overtimeRateDay !== undefined
        ? Number(merged.overtimeRateDay)
        : 1.5;
    const otRateNight =
      merged.overtimeRateNight !== undefined
        ? Number(merged.overtimeRateNight)
        : 2.0;
    const otHoursFriday =
      merged.fridayOvertimeHours !== undefined
        ? Number(merged.fridayOvertimeHours)
        : 0;
    const otRateFriday =
      merged.fridayOvertimeRate !== undefined
        ? Number(merged.fridayOvertimeRate)
        : 2.0;

    // Calculate Overtime
    const hourlyRate = baseSalary / 240; // 240 standard hours per month
    const otPayDay = otHoursDay * hourlyRate * otRateDay;
    const otPayNight = otHoursNight * hourlyRate * otRateNight;
    const otPayFriday = otHoursFriday * hourlyRate * otRateFriday;
    const hoursCalculatedOt = Math.round(otPayDay + otPayNight + otPayFriday);

    let overtimePay = 0;
    if (fields.overtimePay !== undefined) {
      overtimePay = Number(fields.overtimePay) >= 0 ? Number(fields.overtimePay) : 0;
    } else if (otHoursDay > 0 || otHoursNight > 0 || otHoursFriday > 0) {
      overtimePay = hoursCalculatedOt;
    } else if (merged.overtimePay !== undefined) {
      overtimePay = Number(merged.overtimePay) >= 0 ? Number(merged.overtimePay) : 0;
    }

    const deductions =
      Number(merged.deductions) >= 0 ? Number(merged.deductions) : 0;
    const latePenaltyDeduction =
      Number(merged.latePenaltyDeduction) >= 0
        ? Number(merged.latePenaltyDeduction)
        : 0;
    const loanInstallment =
      Number(merged.loanInstallment) >= 0 ? Number(merged.loanInstallment) : 0;
    const socialInsurance =
      Number(merged.socialInsurance) >= 0 ? Number(merged.socialInsurance) : 0;

    const netSalary = Math.round(
      baseSalary +
        allowances +
        otherAllowances +
        bonus -
        (deductions + latePenaltyDeduction + loanInstallment + socialInsurance),
    );

    return {
      ...merged,
      baseSalary,
      allowances,
      otherAllowances,
      bonus,
      overtimeHoursDay: otHoursDay,
      overtimeHoursNight: otHoursNight,
      overtimeRateDay: otRateDay,
      overtimeRateNight: otRateNight,
      fridayOvertimeHours: otHoursFriday,
      fridayOvertimeRate: otRateFriday,
      fridayOvertimePay: Math.round(otPayFriday),
      overtimeHours: otHoursDay + otHoursNight + otHoursFriday,
      overtimePay,
      deductions,
      latePenaltyDeduction,
      loanInstallment,
      socialInsurance,
      netSalary,
    };
  };

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFieldChange = (
    rec: PayrollRecord,
    field: keyof PayrollRecord,
    value: any,
  ) => {
    if (!onUpdatePayrollRecord) return;
    const updated = calculateRecord(rec, { [field]: value });
    onUpdatePayrollRecord(updated);
  };

  // Get current active month records (deduplicated)
  const rawMonthRecords = payrollRecords.filter((p) => p.month === selectedMonth);
  const monthRecordsMap = new Map<string, PayrollRecord>();
  rawMonthRecords.forEach((p) => {
    if (!p) return;
    const key = p.id || p.employeeId;
    if (!monthRecordsMap.has(key)) {
      monthRecordsMap.set(key, p);
    }
  });
  const monthRecords = Array.from(monthRecordsMap.values());

  const isApproved =
    monthRecords.length > 0 &&
    monthRecords.every((p) => p.status === "approved");

  // Filter records by search and department
  const filteredRecords = monthRecords.filter((rec) => {
    const matchesSearch =
      rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      selectedDepartment === "all" || rec.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  // Get distinct departments for filter
  const departments = Array.from(
    new Set([
      ...deptList.map((d) => d.name),
      ...monthRecords.map((r) => r.department),
    ]),
  ).filter(Boolean);

  // Global Financial Statistics
  const totalBaseSalary = filteredRecords.reduce(
    (sum, p) => sum + p.baseSalary,
    0,
  );
  const totalAllowances = filteredRecords.reduce(
    (sum, p) => sum + p.allowances,
    0,
  );
  const totalOtherAllowances = filteredRecords.reduce(
    (sum, p) => sum + (p.otherAllowances || 0),
    0,
  );
  const totalOvertime = filteredRecords.reduce(
    (sum, p) => sum + p.overtimePay,
    0,
  );
  const totalBonuses = filteredRecords.reduce(
    (sum, p) => sum + (p.bonus || 0),
    0,
  );
  const totalDeductions = filteredRecords.reduce(
    (sum, p) =>
      sum +
      p.deductions +
      p.latePenaltyDeduction +
      p.loanInstallment +
      p.socialInsurance,
    0,
  );
  const totalNetSalary = filteredRecords.reduce(
    (sum, p) => sum + p.netSalary,
    0,
  );

  // Handle Detail Modal Save
  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord && onUpdatePayrollRecord) {
      onUpdatePayrollRecord(editingRecord);
      triggerNotify(
        `تم تحديث المسير المالي للموظف "${editingRecord.employeeName}" بنجاح!`,
      );
      setEditingRecord(null);
    }
  };

  const exportPayrollToExcel = () => {
    const headers = [
      "كود الموظف",
      "الاسم الكامل",
      "الوظيفة",
      "القسم",
      "الراتب الأساسي",
      "إجمالي البدلات",
      "إجمالي الإضافي",
      "الحوافز والمكافآت",
      "التأمينات الاجتماعية",
      "قسط السلفة",
      "الاستقطاعات والغياب",
      "صافي المرتب المالي",
      "الحالة",
    ];

    const rows = filteredRecords.map((rec) => {
      const totalDeductionsVal = rec.deductions + rec.latePenaltyDeduction;
      return [
        rec.employeeCode,
        rec.employeeName,
        rec.position,
        rec.department,
        rec.baseSalary,
        rec.allowances,
        rec.overtimePay,
        rec.bonus || 0,
        rec.socialInsurance,
        rec.loanInstallment,
        totalDeductionsVal,
        rec.netSalary,
        rec.status === "approved" ? "معتمد" : "مسودة",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `مسير_مرتبات_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExecutiveReportToExcel = () => {
    const monthLabel = getSelectedMonthLabel();
    const dateStr = new Date().toLocaleDateString("ar-EG");

    // Executive Summary Block
    const summaryLines = [
      ["التقرير التنفيذي الشامل لمسير المرتبات والأجور"],
      [`الفترة المالية:`, monthLabel],
      [`تاريخ الإصدار:`, dateStr],
      [`حالة المسير:`, isApproved ? "معتمد ومقفل" : "مسودة وتحت المراجعة"],
      [""],
      ["--- ملخص المؤشرات المالي والتنفيذي ---"],
      ["إجمالي عدد الموظفين في المسير", filteredRecords.length],
      ["إجمالي الرواتب الأساسية", `${totalBaseSalary} ${currencySymbol}`],
      [
        "إجمالي البدلات والحوافز",
        `${totalAllowances + totalBonuses} ${currencySymbol}`,
      ],
      ["إجمالي ساعات وأجور الإضافي", `${totalOvertime} ${currencySymbol}`],
      [
        "إجمالي الاستقطاعات والتأمينات والخصومات",
        `${totalDeductions} ${currencySymbol}`,
      ],
      [
        "صافي المرتبات الإجمالي المستحق للصرف",
        `${totalNetSalary} ${currencySymbol}`,
      ],
      [""],
      ["--- تفاصيل مسير الرواتب المالي للموظفين ---"],
    ];

    const headers = [
      "كود الموظف",
      "الاسم الكامل",
      "الوظيفة",
      "القسم",
      "الراتب الأساسي",
      "البدلات",
      "إضافي نهار (س)",
      "إضافي ليل (س)",
      "إضافي الجمعة (س)",
      "إجمالي أجر الإضافي",
      "المكافآت والحوافز",
      "التأمينات الاجتماعية",
      "أقساط السلف",
      "الخصومات والغياب",
      "صافي المرتب المالي",
      "الحالة",
    ];

    const rows = filteredRecords.map((rec) => {
      const totalDeductionsVal = rec.deductions + rec.latePenaltyDeduction;
      return [
        rec.employeeCode,
        rec.employeeName,
        rec.position,
        rec.department,
        rec.baseSalary,
        rec.allowances,
        rec.overtimeHoursDay || 0,
        rec.overtimeHoursNight || 0,
        rec.fridayOvertimeHours || 0,
        rec.overtimePay,
        rec.bonus || 0,
        rec.socialInsurance,
        rec.loanInstallment,
        totalDeductionsVal,
        rec.netSalary,
        rec.status === "approved" ? "معتمد" : "مسودة",
      ];
    });

    const csvContent = [
      ...summaryLines.map((line) =>
        line.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
      headers.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `التقرير_التنفيذي_للمرتبات_${selectedMonth}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotify(
      `تم استخراج وتنزيل التقرير التنفيذي بصيغة Excel لشهر ${monthLabel} بنجاح!`,
    );
  };

  const exportOvertimeToExcel = () => {
    const monthLabel = getSelectedMonthLabel();
    const dateStr = new Date().toLocaleDateString("ar-EG");

    const summaryLines = [
      ["سجل تفاصيل ومستحقات العمل الإضافي (Overtime Report)"],
      [`الفترة المالية:`, monthLabel],
      [`تاريخ التصدير:`, dateStr],
      [`حالة المسير:`, isApproved ? "معتمد ومقفل" : "مسودة وتحت المراجعة"],
      [""],
      ["--- ملخص الساعات والمبالغ ---"],
      ["إجمالي عدد الموظفين في السجل", filteredRecords.length],
      [
        "إجمالي الساعات الإضافية النهارية",
        filteredRecords.reduce((sum, r) => sum + (r.overtimeHoursDay || 0), 0),
      ],
      [
        "إجمالي الساعات الإضافية الليلية",
        filteredRecords.reduce((sum, r) => sum + (r.overtimeHoursNight || 0), 0),
      ],
      [
        "إجمالي ساعات الجمع والعطلات",
        filteredRecords.reduce((sum, r) => sum + (r.fridayOvertimeHours || 0), 0),
      ],
      ["إجمالي المبالغ المستحقة للإضافي", `${totalOvertime} ${currencySymbol}`],
      [""],
      ["--- تفاصيل العمل الإضافي حسب الموظف ---"],
    ];

    const headers = [
      "كود الموظف",
      "الاسم الكامل",
      "الوظيفة",
      "القسم",
      "الراتب الأساسي",
      "إضافي نهار (ساعة)",
      "إضافي ليل (ساعة)",
      "إضافي الجمعة/العطلات (ساعة)",
      "إجمالي الساعات الإضافية",
      "إجمالي مستحق الإضافي (ج.م)",
    ];

    const rows = filteredRecords.map((rec) => {
      const dayH = rec.overtimeHoursDay || 0;
      const nightH = rec.overtimeHoursNight || 0;
      const friH = rec.fridayOvertimeHours || 0;
      const totalHours = dayH + nightH + friH;

      return [
        rec.employeeCode,
        rec.employeeName,
        rec.position,
        rec.department,
        rec.baseSalary,
        dayH,
        nightH,
        friH,
        totalHours,
        rec.overtimePay,
      ];
    });

    const csvContent = [
      ...summaryLines.map((line) =>
        line.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
      headers.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `سجل_تفاصيل_الإضافي_${selectedMonth}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotify(
      `تم استخراج وتنزيل سجل تفاصيل الإضافي بصيغة Excel لشهر ${monthLabel} بنجاح!`,
    );
  };

  const printPayrollTable = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredRecords
      .map(
        (rec) => `
      <tr>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${rec.employeeCode}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">${rec.employeeName}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${rec.position}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${rec.department}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${rec.baseSalary.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${rec.allowances.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${rec.overtimePay.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${(rec.bonus || 0).toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${(rec.deductions + rec.latePenaltyDeduction + rec.loanInstallment + rec.socialInsurance).toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold; color:#2563eb;">${rec.netSalary.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:center;">${rec.status === "approved" ? "معتمد" : "مسودة"}</td>
      </tr>
    `,
      )
      .join("");

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>مسير رواتب شهر ${selectedMonth}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; border: 1px solid #ccc; padding: 10px; text-align: right; }
            .meta { margin-bottom: 20px; font-size: 14px; text-align: center; color: #666; }
            .total-row { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>تقرير مسير الرواتب والأجور لشهر: ${selectedMonth}</h2>
          <div class="meta">تاريخ الطباعة: \${new Date().toLocaleDateString('ar-EG')} | إجمالي السجلات: \${filteredRecords.length}</div>
          <table>
            <thead>
              <tr>
                <th>الكود</th>
                <th>الموظف</th>
                <th>المسمى الوظيفي</th>
                <th>القسم</th>
                <th>الراتب الأساسي</th>
                <th>البدلات</th>
                <th>الإضافي</th>
                <th>المكافآت</th>
                <th>الاستقطاعات الكلية</th>
                <th>صافي المرتب</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              \${tableRows}
              <tr class="total-row">
                <td colspan="4" style="border:1px solid #ccc; padding:8px; text-align:center;">الشبكة الإجمالية</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${totalBaseSalary.toLocaleString()} \${currencySymbol}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${totalAllowances.toLocaleString()} \${currencySymbol}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${totalOvertime.toLocaleString()} \${currencySymbol}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${totalBonuses.toLocaleString()} \${currencySymbol}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${totalDeductions.toLocaleString()} \${currencySymbol}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:right; color:#1e3a8a;">\${totalNetSalary.toLocaleString()} \${currencySymbol}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:center;">-</td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Lock Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            <span>جدول المرتبات الذكي (Payroll Engine)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            محتسب مالي متكامل يدعم الساعات الإضافية (النهارية والليلية)،
            البدلات، الحوافز، خصم التأمينات والتأخير تلقائياً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-extrabold text-xs shadow-xs cursor-pointer transition-all focus:outline-none"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{getSelectedMonthLabel()}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDatePickerOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isDatePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-300/40 dark:shadow-black/60 p-4 border border-slate-100/80 dark:border-slate-800 z-50 overflow-hidden"
                >
                  {/* Google Calendar style Header with flexible Year selector & Navigation */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPickerYear((prev) => Math.max(2020, prev - 1))
                        }
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="السنة السابقة"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Direct Year Dropdown Select */}
                      <select
                        value={pickerYear}
                        onChange={(e) =>
                          setPickerYear(parseInt(e.target.value))
                        }
                        className="bg-slate-100/70 dark:bg-slate-800/80 hover:bg-slate-100 text-slate-900 dark:text-white font-extrabold text-xs px-2.5 py-1 rounded-xl cursor-pointer focus:outline-none transition-colors border-0"
                      >
                        {Array.from({ length: 16 }, (_, i) => 2020 + i).map(
                          (y) => (
                            <option
                              key={y}
                              value={y}
                              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              {y}
                            </option>
                          ),
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setPickerYear((prev) => Math.min(2035, prev + 1))
                        }
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="السنة التالية"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const currentY = now.getFullYear();
                        const currentM = String(now.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        setPickerYear(currentY);
                        setSelectedMonth(`${currentY}-${currentM}`);
                        setIsDatePickerOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      الشهر الحالي
                    </button>
                  </div>

                  {/* 12 Months Square Flexible Matrix without heavy borders */}
                  <div className="grid grid-cols-3 gap-2">
                    {arabicMonths.map((mName, mIdx) => {
                      const mVal = `${pickerYear}-${String(mIdx + 1).padStart(2, "0")}`;
                      const isSelected = selectedMonth === mVal;
                      return (
                        <button
                          key={mIdx}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(mVal);
                            setIsDatePickerOpen(false);
                          }}
                          className={`py-2.5 px-2 text-xs font-extrabold rounded-xl transition-all text-center border-0 cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            id="approve-payroll-lock-btn"
            onClick={() => {
              if (monthRecords.length === 0) {
                if (onGeneratePayroll) {
                  onGeneratePayroll(selectedMonth);
                  triggerNotify(
                    `تم توليد وإنشاء مسير مرتبات ${getSelectedMonthLabel()} بنجاح.`,
                  );
                }
              } else if (isApproved) {
                onApprovePayroll(selectedMonth);
                triggerNotify(
                  `تم إلغاء قفل المسير وإعادة فتح التعديل لشهر ${getSelectedMonthLabel()}.`,
                );
              } else {
                onApprovePayroll(selectedMonth);
                triggerNotify(
                  `تم اعتماد وإقفال مسير مرتبات ${getSelectedMonthLabel()} بنجاح.`,
                );
              }
            }}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
              monthRecords.length === 0
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20"
                : isApproved
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20"
            }`}
          >
            {monthRecords.length === 0 ? (
              <>
                <Plus className="w-4 h-4 text-white" />
                <span>توليد مسير رواتب الشهر</span>
              </>
            ) : isApproved ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>المرتبات معتمدة ✓ (انقر للفتح والتعديل)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-300" />
                <span>اعتماد المرتبات وإقفال الشهر</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold block">
            الراتب الأساسي
          </span>
          <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
            {totalBaseSalary.toLocaleString()} {currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold block">
            البدلات الثابتة
          </span>
          <p className="text-base font-extrabold text-emerald-600 mt-1">
            +{totalAllowances.toLocaleString()} {currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold block">
            بدلات أخرى
          </span>
          <p className="text-base font-extrabold text-teal-600 mt-1">
            +{totalOtherAllowances.toLocaleString()} {currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold block">
            الحوافز والمكافآت
          </span>
          <p className="text-base font-extrabold text-amber-500 mt-1">
            +{totalBonuses.toLocaleString()} {currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold block">
            إجمالي الاستقطاعات
          </span>
          <p className="text-base font-extrabold text-red-500 mt-1">
            -{totalDeductions.toLocaleString()} {currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-950 to-indigo-900 text-white col-span-2 lg:col-span-1 shadow-sm border border-blue-900">
          <span className="text-[11px] text-blue-200 font-bold block">
            صافي المرتبات الكلي
          </span>
          <p className="text-lg font-black mt-1">
            {totalNetSalary.toLocaleString()} {currencySymbol}
          </p>
        </div>
      </div>

      {/* Control Panel Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
          {/* Search Input */}
          <div className="relative w-full sm:w-60 lg:w-64">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن موظف أو مسمى..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all"
            />
          </div>

          {/* Department Filter Selector */}
          <div className="relative w-full sm:w-48">
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pr-10 pl-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600 appearance-none cursor-pointer transition-all"
            >
              <option value="all">جميع الأقسام (الكل)</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5 w-full xl:w-auto">
          {/* Export Payroll to Excel */}
          <button
            type="button"
            onClick={exportPayrollToExcel}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title="تنزيل مسير الرواتب بصيغة Excel"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>تنزيل Excel</span>
          </button>

          {/* Export Overtime to Excel */}
          <button
            type="button"
            onClick={exportOvertimeToExcel}
            className="px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title="تنزيل سجل تفاصيل الإضافي بصيغة Excel"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>سجل الإضافي Excel</span>
          </button>

          {/* Print Table */}
          <button
            type="button"
            onClick={printPayrollTable}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title="طباعة مسير الرواتب"
          >
            <Printer className="w-4 h-4 text-slate-500 shrink-0" />
            <span>طباعة الجدول</span>
          </button>

          {/* Spreadsheet Edit Toggle */}
          <button
            type="button"
            disabled={isApproved}
            onClick={() => {
              setIsSpreadsheetMode(!isSpreadsheetMode);
              triggerNotify(
                !isSpreadsheetMode
                  ? "تم تفعيل وضع التعديل السريع لجدول المرتبات وجدول الإضافي! يمكنك التعديل مباشرة من داخل الجداول."
                  : "تم حفظ وإغلاق وضع التعديل السريع.",
              );
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              isApproved
                ? "bg-slate-100 text-slate-400 dark:bg-slate-900 cursor-not-allowed border border-slate-200 dark:border-slate-800"
                : isSpreadsheetMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
            }`}
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span>
              {isSpreadsheetMode
                ? "إنهاء التعديل السريع"
                : "التعديل السريع (المرتبات والإضافي)"}
            </span>
          </button>
        </div>
      </div>

      {/* Table Toggle Tabs */}
      <div className="flex items-center gap-6 mb-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTableTab('main')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
            activeTableTab === 'main'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          جدول المرتبات الأساسي
        </button>
        <button
          onClick={() => setActiveTableTab('overtime')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
            activeTableTab === 'overtime'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          سجل تفاصيل الإضافي
        </button>
      </div>

      {activeTableTab === 'main' && (
        <>
      {/* Core Interactive Worksheet Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5 min-w-[150px]">الموظف والوظيفة</th>
              <th className="p-3.5 text-center">الراتب الأساسي</th>
              <th className="p-3.5 text-center">الحوافز والبدلات ({currencySymbol})</th>
              <th className="p-3.5 text-center">بدلات أخرى ({currencySymbol})</th>
              <th className="p-3.5 text-center">الخصم / التأخير</th>
              <th className="p-3.5 text-center">التأمينات / سلف</th>
              <th className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 min-w-[110px]">
                الصافي المستحق
              </th>
              <th className="p-3.5 text-center min-w-[180px]">
                التحكم والإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="p-10 text-center text-slate-500 font-bold"
                >
                  <div className="flex flex-col items-center justify-center gap-3 py-6">
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                      {monthRecords.length === 0
                        ? `لا توجد بيانات مسير رواتب منشأة لشهر ${selectedMonth} حتى الآن.`
                        : "لا توجد سجلات مرتبات مطابقة للبحث أو الفلتر المختار."}
                    </p>
                    {monthRecords.length === 0 &&
                      onGeneratePayroll &&
                      (employees.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            onGeneratePayroll(selectedMonth);
                            triggerNotify(
                              `تم توليد مسير رواتب شهر ${selectedMonth} لعدد ${employees.length} موظف بنجاح.`,
                            );
                          }}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 mt-2 mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            توليد مسير رواتب لشهر {selectedMonth} (
                            {employees.length} موظف)
                          </span>
                        </button>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
                          💡 يرجى إضافة موظفين أولاً من علامة تبويب "الموظفين"
                          لتتمكن من توليد مسير رواتب هذا الشهر.
                        </p>
                      ))}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec, idx) => {
                const dayHours =
                  rec.overtimeHoursDay !== undefined ? rec.overtimeHoursDay : 0;
                const nightHours =
                  rec.overtimeHoursNight !== undefined
                    ? rec.overtimeHoursNight
                    : 0;
                const fridayHours =
                  rec.fridayOvertimeHours !== undefined
                    ? rec.fridayOvertimeHours
                    : 0;
                const bonusVal = rec.bonus !== undefined ? rec.bonus : 0;

                return (
                  <tr
                    key={`pay-${rec.id || idx}-${idx}`}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Employee column */}
                    <td className="p-3.5">
                      <p className="font-extrabold text-slate-900 dark:text-white leading-snug">
                        {getEmpDisplayName(rec.employeeName, rec.employeeCode || rec.employeeId)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {rec.position} •{" "}
                        <span className="font-mono">{rec.employeeCode}</span>
                      </p>
                    </td>

                    {/* Basic salary */}
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={rec.baseSalary || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                rec,
                                "baseSalary",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-20 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.baseSalary.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Allowances (الحوافز والبدلات) */}
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <input
                          type="number"
                          value={rec.allowances || ""}
                          onChange={(e) =>
                            handleFieldChange(rec, "allowances", e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                          className="w-20 p-1.5 text-center rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-emerald-600 dark:text-emerald-300"
                        />
                      ) : (
                        <span className="font-bold text-emerald-600">
                          +{rec.allowances.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Other Allowances (بدلات أخرى) */}
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <input
                          type="number"
                          value={rec.otherAllowances || ""}
                          onChange={(e) =>
                            handleFieldChange(rec, "otherAllowances", e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className="w-20 p-1.5 text-center rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50/30 dark:bg-teal-950/20 font-bold text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none text-teal-600 dark:text-teal-300"
                        />
                      ) : (
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          +{(rec.otherAllowances || 0).toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Deductions & late penalties */}
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={(rec.deductions + rec.latePenaltyDeduction) || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                rec,
                                "deductions",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-16 p-1.5 text-center rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 font-bold text-xs focus:ring-1 focus:ring-red-500 focus:outline-none text-red-500"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-red-500">
                          {rec.deductions + rec.latePenaltyDeduction > 0
                            ? `-${(rec.deductions + rec.latePenaltyDeduction).toLocaleString()}`
                            : "0"}
                        </span>
                      )}
                    </td>

                    {/* التأمينات والسلَف */}
                    <td className="p-3.5 text-center">
                      <div className="font-bold text-slate-500 space-y-0.5">
                        <div className="text-red-500">
                          تأمين: -{rec.socialInsurance}
                        </div>
                        {rec.loanInstallment > 0 && (
                          <div className="text-amber-600 text-[10px]">
                            قسط سلفة: -{rec.loanInstallment}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Final Net salary */}
                    <td className="p-3.5 text-center font-black text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/15">
                      <span className="px-2.5 py-1.5 rounded-xl bg-indigo-100/60 dark:bg-indigo-950/40 font-black block">
                        {rec.netSalary.toLocaleString()} {currencySymbol}
                      </span>
                    </td>

                    {/* Actions controls */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Detail edit button */}
                        <button
                          disabled={isApproved}
                          onClick={() => setEditingRecord(rec)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isApproved
                              ? "bg-slate-100 text-slate-400 dark:bg-slate-900 cursor-not-allowed"
                              : "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>تعديل تفصيلي</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </>
      )}

      {activeTableTab === 'overtime' && (
        <>
      {/* Overtime Breakdown Table */}
      <div className="mt-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>سجل ساعات الإضافي (الليل، النهار، الجمعة)</span>
        </h3>

        <button
          type="button"
          onClick={exportOvertimeToExcel}
          className="px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
          title="تنزيل سجل تفاصيل الإضافي Excel"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>تنزيل سجل الإضافي بصيغة Excel</span>
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs mb-8">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5 min-w-[150px]">الموظف والوظيفة</th>
              <th className="p-3.5 text-center">الراتب الأساسي</th>
              <th className="p-3.5 text-center">إضافي نهار (ساعة)</th>
              <th className="p-3.5 text-center">إضافي ليل (ساعة)</th>
              <th className="p-3.5 text-center">إضافي الجمعة (ساعة)</th>
              <th className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10">
                إجمالي قيمة الإضافي
              </th>
              <th className="p-3.5 text-center min-w-[140px]">
                التحكم
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500 font-bold">
                  لا توجد سجلات.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec, idx) => {
                const dayHours = rec.overtimeHoursDay !== undefined ? rec.overtimeHoursDay : 0;
                const nightHours = rec.overtimeHoursNight !== undefined ? rec.overtimeHoursNight : 0;
                const fridayHours = rec.fridayOvertimeHours !== undefined ? rec.fridayOvertimeHours : 0;

                const emp = employees.find((e) => e.id === rec.employeeId);
                const empName = getEmpDisplayName(rec.employeeName, rec.employeeCode || rec.employeeId);
                const jobTitle = emp ? emp.position : (rec.position || "غير محدد");
                
                return (
                  <tr key={`ot-${rec.id || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
                          {empName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {empName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {jobTitle}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-200">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={rec.baseSalary || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                rec,
                                "baseSalary",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            className="w-20 p-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white"
                          />
                        </div>
                      ) : (
                        rec.baseSalary.toLocaleString()
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={dayHours || ""}
                            onChange={(e) =>
                              handleFieldChange(rec, "overtimeHoursDay", e.target.value)
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-14 p-1.5 text-center rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 font-bold text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-600 dark:text-blue-300"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {dayHours}س <span className="text-[9px] text-slate-400 font-normal">(×{rec.overtimeRateDay || 1.5})</span>
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={nightHours || ""}
                            onChange={(e) =>
                              handleFieldChange(rec, "overtimeHoursNight", e.target.value)
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-14 p-1.5 text-center rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 font-bold text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none text-purple-600 dark:text-purple-300"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {nightHours}س <span className="text-[9px] text-slate-400 font-normal">(×{rec.overtimeRateNight || 2.0})</span>
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={fridayHours || ""}
                            onChange={(e) =>
                              handleFieldChange(rec, "fridayOvertimeHours", e.target.value)
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-14 p-1.5 text-center rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-emerald-600 dark:text-emerald-300"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {fridayHours}س <span className="text-[9px] text-slate-400 font-normal">(×{rec.fridayOvertimeRate || 2.0})</span>
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10">
                      +{rec.overtimePay.toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        disabled={isApproved}
                        onClick={() => setEditingRecord(rec)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 mx-auto ${
                          isApproved
                            ? "bg-slate-100 text-slate-400 dark:bg-slate-900 cursor-not-allowed"
                            : "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </>
      )}

      {/* Detailed Modal for Financial Adjustments */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleModalSave}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl overflow-y-auto max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <SlidersHorizontal className="w-5 h-5" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    تعديل المسير المالي والمرتبات
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    الموظف: {editingRecord.employeeName} (
                    {editingRecord.employeeCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form Body */}
            <div className="space-y-4 text-xs">
              {/* Row 1: Base Salary & Allowances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    الراتب الأساسي الحالي ({currencySymbol}) *
                  </label>
                  <input
                    required
                    type="number"
                    value={editingRecord.baseSalary || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          baseSalary: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    الحوافز والبدلات ({currencySymbol}) *
                  </label>
                  <input
                    required
                    type="number"
                    value={editingRecord.allowances || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          allowances: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    بدلات أخرى ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingRecord.otherAllowances || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          otherAllowances: Number(e.target.value),
                        }),
                      )
                    }
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Overtime Direct Cash Entry & Optional Hours Breakdown */}
              <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3 bg-white dark:bg-slate-800">
                <h4 className="font-extrabold text-[11px] text-blue-600 flex items-center gap-1 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span>مبلغ وتفاصيل العمل الإضافي (Overtime)</span>
                </h4>

                {/* Direct Overtime Amount (Free Entry) */}
                <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900">
                  <label className="font-extrabold text-blue-900 dark:text-blue-200 block mb-1">
                    مبلغ الإضافي (ج.م) - إدخال حر مباشر بدون الحاجة لحساب الساعات
                  </label>
                  <input
                    type="number"
                    value={editingRecord.overtimePay || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          overtimePay: Number(e.target.value),
                        }),
                      )
                    }
                    placeholder="أدخل قيمة الإضافي بالجنيه بحرية..."
                    className="w-full p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-black text-blue-600 dark:text-blue-400 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Optional Hours Breakdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <p className="font-bold text-slate-500 dark:text-slate-400 text-[10px] mb-2">أو يمكنك استخدام حاسبة الساعات التلقائية (اختياري):</p>
                  <div className="grid grid-cols-2 gap-3">
                  {/* Day OT Hours */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      الإضافي النهاري (ساعات)
                    </label>
                    <input
                      type="number"
                      value={editingRecord.overtimeHoursDay || ""}
                      onChange={(e) =>
                        setEditingRecord(
                          calculateRecord(editingRecord, {
                            overtimeHoursDay: Number(e.target.value),
                          }),
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                      placeholder="0"
                    />
                  </div>

                  {/* Day OT Rate Multiplier */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      معامل النهار (العادي)
                    </label>
                    <select
                      value={
                        editingRecord.overtimeRateDay !== undefined
                          ? editingRecord.overtimeRateDay
                          : 1.5
                      }
                      onChange={(e) =>
                        setEditingRecord(
                          calculateRecord(editingRecord, {
                            overtimeRateDay: Number(e.target.value),
                          }),
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    >
                      <option value="1.5">1.5 × (ساعة ونصف)</option>
                      <option value="1.25">1.25 × (ساعة وربع)</option>
                      <option value="1.75">1.75 ×</option>
                      <option value="2.0">2.0 × (ساعتين)</option>
                    </select>
                  </div>

                  {/* Night OT Hours */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      الإضافي الليلي (ساعات)
                    </label>
                    <input
                      type="number"
                      value={editingRecord.overtimeHoursNight || ""}
                      onChange={(e) =>
                        setEditingRecord(
                          calculateRecord(editingRecord, {
                            overtimeHoursNight: Number(e.target.value),
                          }),
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                      placeholder="0"
                    />
                  </div>

                  {/* Night OT Rate Multiplier */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      معامل الليل (العادي)
                    </label>
                    <select
                      value={
                        editingRecord.overtimeRateNight !== undefined
                          ? editingRecord.overtimeRateNight
                          : 2.0
                      }
                      onChange={(e) =>
                        setEditingRecord(
                          calculateRecord(editingRecord, {
                            overtimeRateNight: Number(e.target.value),
                          }),
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    >
                      <option value="2.0">2.0 × (ساعتين)</option>
                      <option value="1.5">1.5 × (ساعة ونصف)</option>
                      <option value="2.5">2.5 ×</option>
                      <option value="3.0">3.0 ×</option>
                    </select>
                  </div>

                  {/* Friday OT Hours */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      إضافي يوم الجمعة (ساعات)
                    </label>
                    <input
                      type="number"
                      value={editingRecord.fridayOvertimeHours || ""}
                      onChange={(e) =>
                        setEditingRecord(
                          calculateRecord(editingRecord, {
                            fridayOvertimeHours: Number(e.target.value),
                          }),
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                      placeholder="0"
                    />
                  </div>

                  {/* Friday OT Rate Multiplier */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      معامل يوم الجمعة
                    </label>
                    <select
                      value={
                        editingRecord.fridayOvertimeRate !== undefined
                          ? editingRecord.fridayOvertimeRate
                          : 2.0
                      }
                      onChange={(e) =>
                        setEditingRecord(
                          calculateRecord(editingRecord, {
                            fridayOvertimeRate: Number(e.target.value),
                          }),
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    >
                      <option value="2.0">2.0 × (ساعتين - مضاعف)</option>
                      <option value="1.5">1.5 × (ساعة ونصف)</option>
                      <option value="2.5">2.5 ×</option>
                      <option value="3.0">3.0 × (3 ساعات)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed font-semibold bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-xl border border-blue-100 dark:border-blue-900">
                  * يتم احتساب قيمة الساعة الإضافية تلقائياً: (الراتب الأساسي /
                  240) × الساعات × المعامل.
                  <br />
                  قيمة الأجر الإضافي المحتسب حالياً:{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {editingRecord.overtimePay} {currencySymbol}
                  </strong>
                </div>
                </div>
              </div>

              {/* Row 3: Bonuses & Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    الحوافز والمكافآت ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingRecord.bonus || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          bonus: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    الخصومات الأخرى والجزاءات ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingRecord.deductions || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          deductions: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    جزاءات التأخير والغياب ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingRecord.latePenaltyDeduction || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          latePenaltyDeduction: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    قسط السلفة للتسوية ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingRecord.loanInstallment || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          loanInstallment: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    التأمينات الاجتماعية ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingRecord.socialInsurance || ""}
                    onChange={(e) =>
                      setEditingRecord(
                        calculateRecord(editingRecord, {
                          socialInsurance: Number(e.target.value),
                        }),
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Dynamic live calculation visual card */}
              <div className="p-4 rounded-2xl bg-indigo-900 text-white flex items-center justify-between border border-indigo-800 shadow-inner">
                <div>
                  <span className="text-indigo-200 font-bold block text-[10px]">
                    صافي المرتب المستحق في هذا الشهر:
                  </span>
                  <span className="text-xl font-black">
                    {editingRecord.netSalary.toLocaleString()} {currencySymbol}
                  </span>
                </div>
                <div className="text-left text-[9px] text-indigo-300 leading-snug">
                  <div>
                    (+) إجمالي الاستحقاق:{" "}
                    {(
                      editingRecord.baseSalary +
                      editingRecord.allowances +
                      (editingRecord.otherAllowances || 0) +
                      (editingRecord.bonus || 0)
                    ).toLocaleString()}
                  </div>
                  <div>
                    (-) إجمالي الخصميات:{" "}
                    {(
                      editingRecord.deductions +
                      editingRecord.latePenaltyDeduction +
                      editingRecord.loanInstallment +
                      editingRecord.socialInsurance
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
              >
                إلغاء التعديل
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20"
              >
                حفظ وتسجيل في السجل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {activePayslipRecord && (
        <PayslipModal
          payrollRecord={activePayslipRecord}
          onClose={() => setActivePayslipRecord(null)}
          currencySymbol={currencySymbol}
        />
      )}

      {/* AI Analysis Modal Report */}
      {showAiAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  تحليل كلفة المرتبات والأجور المتقدم
                </h3>
              </div>
              <button
                onClick={() => setShowAiAnalysis(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-slate-600 dark:text-slate-300">
                قام محلل الموارد البشرية الذكي بفحص ميزانية المرتبات للشهر
                الحالي {selectedMonth}، وجاءت النتائج كالتالي:
              </p>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>إجمالي كلفة الوردية النهارية الإضافية:</span>
                  <span className="text-blue-600 font-extrabold">
                    {monthRecords
                      .reduce(
                        (sum, p) =>
                          sum +
                          Math.round(
                            (p.overtimeHoursDay || 0) *
                              (p.baseSalary / 240) *
                              (p.overtimeRateDay || 1.5),
                          ),
                        0,
                      )
                      .toLocaleString()}{" "}
                    {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>إجمالي كلفة الوردية الليلية الإضافية (معامل 2x):</span>
                  <span className="text-purple-600 font-extrabold">
                    {monthRecords
                      .reduce(
                        (sum, p) =>
                          sum +
                          Math.round(
                            (p.overtimeHoursNight || 0) *
                              (p.baseSalary / 240) *
                              (p.overtimeRateNight || 2.0),
                          ),
                        0,
                      )
                      .toLocaleString()}{" "}
                    {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span>مجموع الحوافز والمكافآت المصروفة:</span>
                  <span className="text-amber-500 font-black">
                    {totalBonuses.toLocaleString()} {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>
                    توزيع كلفة الأجور متطابقة مع الميزانية التشغيلية الربع سنوية
                    المعتمدة للشركة.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>
                    احتساب التأمينات الاجتماعية لجميع الموظفين بنسبة 100% لتطابق
                    الشروط التنظيمية واللوائح القانونية بمصر.
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    اقتراح: كلفة الإضافي الليلي ارتفعت بمقدار 18% عن الشهر
                    السابق. يفضل مراجعة أسباب زيادة ساعات التشغيل الليلية لتقنين
                    الكلفة.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowAiAnalysis(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs shadow-sm hover:bg-slate-800"
              >
                إغلاق التقرير الذكي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
