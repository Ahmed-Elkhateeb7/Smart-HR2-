import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  FileText,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldAlert,
  Building2,
  X,
  CreditCard,
  Laptop,
  Edit3,
  Trash2,
  ChevronDown,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  User,
  ShieldCheck
} from 'lucide-react';
import { Employee, Asset, Loan, Department } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  departments: Department[];
  assets: Asset[];
  loans: Loan[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddEmployee: (emp: Employee, initialAssetCode?: string) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  currencySymbol: string;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  departments,
  assets,
  loans,
  searchTerm,
  setSearchTerm,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  currencySymbol,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [activeProfileEmployee, setActiveProfileEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmpForm, setEditEmpForm] = useState<Employee | null>(null);
  const [showNewDeptDropdown, setShowNewDeptDropdown] = useState(false);
  const [showEditDeptDropdown, setShowEditDeptDropdown] = useState(false);

  // Excel Import States
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedImportEmps, setParsedImportEmps] = useState<Employee[]>([]);
  const [importStatusMsg, setImportStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // Helper date parser
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        if (dateObj) {
          const y = dateObj.y;
          const m = String(dateObj.m).padStart(2, '0');
          const d = String(dateObj.d).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch {
        // fallback
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) return str.replace(/\//g, '-');
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const parts = str.split('-');
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return str || '';
  };

  // Download Sample Excel Template with Dropdown Data Validation for Departments
  const handleDownloadExcelTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'نظام إدارة الموارد البشرية';
      workbook.lastModifiedBy = 'نظام إدارة الموارد البشرية';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Official 10 departments list from system / props
      const deptNames =
        departments && departments.length > 0
          ? departments.map((d) => d.name)
          : [
              'تكنولوجيا المعلومات',
              'الموارد البشرية',
              'التسويق والمبيعات',
              'المالية والمحاسبة',
              'التشغيل والخدمات',
              'قسم الإدارة',
              'قسم المخازن',
              'قسم الجودة',
              'قسم الحركة والنقل',
              'قسم المشتريات',
            ];

      // 1. Reference Worksheet: الأقسام (Departments List)
      const deptSheet = workbook.addWorksheet('الأقسام', {
        views: [{ rightToLeft: true }],
      });

      deptSheet.columns = [
        { header: 'الأقسام المعتمدة في النظام', key: 'name', width: 32 },
        { header: 'ملاحظات وتوجيهات', key: 'notes', width: 50 },
      ];

      // Style Dept Sheet Header
      const deptHeaderRow = deptSheet.getRow(1);
      deptHeaderRow.height = 28;
      deptHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
      deptHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
      deptHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F766E' }, // Teal
      };

      deptNames.forEach((dept, idx) => {
        const r = deptSheet.addRow({
          name: dept,
          notes: idx === 0 ? 'هذه قائمة الـ 10 أقسام المعتمدة في النظام وتستخدم كقائمة منسدلة داخل شيت الموظفين' : '',
        });
        r.height = 22;
        r.alignment = { vertical: 'middle', horizontal: 'right' };
        r.font = { size: 10, name: 'Segoe UI' };
      });

      // 2. Main Worksheet: الموظفين (Employees Sheet)
      const worksheet = workbook.addWorksheet('الموظفين', {
        views: [{ rightToLeft: true }],
      });

      worksheet.columns = [
        { header: 'الكود الوظيفي', key: 'code', width: 16 },
        { header: 'اسم الموظف', key: 'name', width: 28 },
        { header: 'الرقم القومي', key: 'nationalId', width: 20 },
        { header: 'تاريخ الميلاد', key: 'birthDate', width: 16 },
        { header: 'تاريخ التعيين', key: 'joinDate', width: 16 },
        { header: 'الحالة الاجتماعية', key: 'maritalStatus', width: 18 },
        { header: 'الخدمة العسكرية', key: 'militaryStatus', width: 20 },
        { header: 'العنوان', key: 'address', width: 28 },
        { header: 'التليفون', key: 'phone', width: 18 },
        { header: 'القسم', key: 'department', width: 26 },
        { header: 'الوظيفة', key: 'position', width: 24 },
        { header: 'الراتب الأساسي', key: 'baseSalary', width: 18 },
        { header: 'الحافز', key: 'incentive', width: 15 },
        { header: 'البدلات', key: 'allowances', width: 15 },
        { header: 'التأمينات', key: 'insuranceStatus', width: 18 },
        { header: 'الرقم التأميني', key: 'insuranceNumber', width: 18 },
        { header: 'حصة العامل', key: 'employeeInsuranceShare', width: 16 },
        { header: 'حصة صاحب العمل', key: 'employerInsuranceShare', width: 18 },
        { header: 'الضريبة', key: 'taxAmount', width: 16 },
        { header: 'اسم البنك', key: 'bankName', width: 20 },
        { header: 'رقم الحساب البنكي', key: 'bankAccount', width: 24 },
        { header: 'صلاحية الهوية', key: 'idExpiry', width: 18 },
        { header: 'الحالة', key: 'status', width: 16 },
      ];

      // Style Main Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 32;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }, // Deep Navy / Slate
      };

      // Sample Data - all 3 rows strictly using the official 10 departments and comprehensive fields
      const sampleData = [
        {
          code: '101',
          name: 'أحمد محمد علي',
          nationalId: '29205141234567',
          birthDate: '1992-05-14',
          joinDate: '2022-01-01',
          maritalStatus: 'متزوج',
          militaryStatus: 'أدى الخدمة',
          address: 'القاهرة - المعادي - شارع النصر',
          phone: '01012345678',
          department: 'تكنولوجيا المعلومات',
          position: 'مطور برمجيات',
          baseSalary: 5000,
          incentive: 500,
          allowances: 750,
          insuranceStatus: 'خاضع للتأمين',
          insuranceNumber: '78945612',
          employeeInsuranceShare: 550,
          employerInsuranceShare: 937.5,
          taxAmount: 250,
          bankName: 'البنك الأهلي المصري',
          bankAccount: 'EG1200030000123456789012',
          idExpiry: '2028-12-31',
          status: 'نشط',
        },
        {
          code: '102',
          name: 'سارة محمود عبدالله',
          nationalId: '29508201234568',
          birthDate: '1995-08-20',
          joinDate: '2023-03-15',
          maritalStatus: 'عزباء',
          militaryStatus: 'غير مطلوب',
          address: 'الجيزة - الدقي - شارع التحرير',
          phone: '01123456789',
          department: 'الموارد البشرية',
          position: 'أخصائي توظيف',
          baseSalary: 4500,
          incentive: 400,
          allowances: 500,
          insuranceStatus: 'خاضع للتأمين',
          insuranceNumber: '89123456',
          employeeInsuranceShare: 495,
          employerInsuranceShare: 843.75,
          taxAmount: 180,
          bankName: 'بنك مصر',
          bankAccount: 'EG4500020000987654321098',
          idExpiry: '2027-06-15',
          status: 'نشط',
        },
        {
          code: '103',
          name: 'خالد إبراهيم حسن',
          nationalId: '28911101234569',
          birthDate: '1989-11-10',
          joinDate: '2021-08-01',
          maritalStatus: 'متزوج ويعول',
          militaryStatus: 'معفى نهائي',
          address: 'الإسكندرية - سموحة',
          phone: '01234567890',
          department: 'المالية والمحاسبة',
          position: 'محاسب عام',
          baseSalary: 4800,
          incentive: 300,
          allowances: 600,
          insuranceStatus: 'خاضع للتأمين',
          insuranceNumber: '92345678',
          employeeInsuranceShare: 528,
          employerInsuranceShare: 900,
          taxAmount: 210,
          bankName: 'البنك التجاري الدولي CIB',
          bankAccount: 'EG7800040000567890123456',
          idExpiry: '2026-11-20',
          status: 'إجازة',
        },
      ];

      sampleData.forEach((item) => {
        const row = worksheet.addRow(item);
        row.height = 24;
        row.alignment = { vertical: 'middle', horizontal: 'right' };
        row.font = { size: 10, name: 'Segoe UI' };
      });

      // Number formatting for numeric columns
      worksheet.getColumn('L').numFmt = '#,##0';
      worksheet.getColumn('M').numFmt = '#,##0';
      worksheet.getColumn('N').numFmt = '#,##0';
      worksheet.getColumn('Q').numFmt = '#,##0.00';
      worksheet.getColumn('R').numFmt = '#,##0.00';
      worksheet.getColumn('S').numFmt = '#,##0.00';

      // Set Data Validation Dropdown for Department column (J) from J2 to J1000
      const lastDeptRow = deptNames.length + 1;
      for (let r = 2; r <= 1000; r++) {
        // Department Dropdown (J)
        const deptCell = worksheet.getCell(`J${r}`);
        deptCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`الأقسام!$A$2:$A$${lastDeptRow}`],
          showInputMessage: true,
          promptTitle: 'اختر القسم',
          prompt: 'يرجى اختيار القسم من القائمة المنسدلة المعتمدة في النظام (10 أقسام).',
          showErrorMessage: true,
          errorTitle: 'قسم غير معتمد',
          error: 'يرجى اختيار قسم من القائمة المنسدلة فقط لضمان مطابقة بيانات الأقسام في النظام.',
        };

        // Marital Status Dropdown (F)
        const maritalCell = worksheet.getCell(`F${r}`);
        maritalCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"أعزب,عزباء,متزوج,متزوجة,متزوج ويعول,مطلق,مطلقة,أرمل,أرملة"'],
          showInputMessage: true,
          promptTitle: 'الحالة الاجتماعية',
          prompt: 'اختر الحالة الاجتماعية (أعزب، متزوج، متزوج ويعول، مطلق، أرمل)',
        };

        // Military Status Dropdown (G)
        const militaryCell = worksheet.getCell(`G${r}`);
        militaryCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"أدى الخدمة,معفى نهائي,معفى مؤقت,غير مطلوب,مؤجل"'],
          showInputMessage: true,
          promptTitle: 'الخدمة العسكرية',
          prompt: 'اختر موقف الخدمة العسكرية (أدى الخدمة، معفى نهائي، معفى مؤقت، غير مطلوب، مؤجل)',
        };

        // Insurance Status Dropdown (O)
        const insuranceCell = worksheet.getCell(`O${r}`);
        insuranceCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"خاضع للتأمين,غير خاضع,معفى"'],
          showInputMessage: true,
          promptTitle: 'التأمينات',
          prompt: 'اختر حالة التأمينات (خاضع للتأمين، غير خاضع، معفى)',
        };

        // Status Dropdown (W)
        const statusCell = worksheet.getCell(`W${r}`);
        statusCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"نشط,إجازة,موقوف,ترك العمل"'],
          showInputMessage: true,
          promptTitle: 'حالة الموظف',
          prompt: 'اختر حالة الموظف (نشط، إجازة، موقوف، ترك العمل)',
          showErrorMessage: true,
          errorTitle: 'حالة غير صحيحة',
          error: 'يرجى اختيار حالة صالحة من القائمة المنسدلة.',
        };
      }

      // Generate binary and trigger download in browser
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'نموذج_استيراد_الموظفين_المعتمد.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Excel template with data validation:', err);
    }
  };

  // Process selected file
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setExcelFile(file);
    setImportStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;
        const wb = XLSX.read(buffer, { type: 'array' });
        // Intelligently select 'الموظفين' or 'Employees' sheet first, fallback to first sheet
        const sheetName =
          wb.SheetNames.find((n) => n.includes('موظف') || n.toLowerCase().includes('employee')) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rows || rows.length === 0) {
          setImportStatusMsg({ type: 'error', text: 'الملف فارغ أو لا يحتوي على بيانات صحيحة.' });
          setParsedImportEmps([]);
          return;
        }

        const parsedList: Employee[] = [];
        rows.forEach((row, idx) => {
          let name = '';
          let employeeCode = '';
          let nationalId = '';
          let birthDate = '';
          let joinDate = '';
          let maritalStatus = '';
          let militaryStatus = '';
          let address = '';
          let phone = '';
          let department = 'عام';
          let position = 'موظف';
          let baseSalary = 0;
          let incentiveVal = 0;
          let allowancesVal = 0;
          let housingVal = 0;
          let transportVal = 0;
          let insuranceStatus = 'خاضع للتأمين';
          let insuranceNumber = '';
          let employeeInsuranceShare = 0;
          let employerInsuranceShare = 0;
          let taxAmount = 0;
          let bankName = '';
          let bankAccount = '';
          let iqamaExpiryDate = '';
          let statusStr = '';

          for (const [key, val] of Object.entries(row)) {
            const k = key.replace(/[\s_\-]/g, '').toLowerCase();
            const v = String(val !== undefined && val !== null ? val : '').trim();
            if (!v) continue;

            if ((k.includes('اسم') || k.includes('name') || k.includes('موظف')) && !k.includes('كود') && !k.includes('رقم') && !k.includes('حالة') && !k.includes('بنك')) {
              name = v;
            } else if (k.includes('كود') || k.includes('رقموظيفي') || k.includes('الكود') || k.includes('code') || k === 'id') {
              employeeCode = v;
            } else if (k.includes('قومي') || k.includes('national') || k.includes('بطاق') || k.includes('رقمقومي')) {
              nationalId = v;
            } else if (k.includes('ميلاد') || k.includes('birth') || k.includes('dob')) {
              birthDate = parseExcelDate(val);
            } else if (k.includes('تعيين') || k.includes('تعين') || k.includes('join') || k.includes('hire') || k.includes('التحاق')) {
              joinDate = parseExcelDate(val);
            } else if (k.includes('اجتماع') || k.includes('marital') || k.includes('زوج') || k.includes('أعزب') || k.includes('اعزب')) {
              maritalStatus = v;
            } else if (k.includes('عسكر') || k.includes('تجنيد') || k.includes('military') || k.includes('جيش') || k.includes('خدمة')) {
              militaryStatus = v;
            } else if (k.includes('عنوان') || k.includes('سكن') || k.includes('اقامة') || k.includes('اقام') || k.includes('address') || k.includes('محل')) {
              address = v;
            } else if (k.includes('هاتف') || k.includes('تليفون') || k.includes('موبايل') || k.includes('جوال') || k.includes('phone') || k.includes('mobile') || k.includes('tel')) {
              phone = v;
            } else if (k.includes('قسم') || k.includes('department') || k.includes('dept')) {
              department = v;
            } else if (k.includes('وظيفة') || k.includes('مسمى') || k.includes('position') || k.includes('title') || k.includes('job')) {
              position = v;
            } else if (k.includes('راتب') || k.includes('salary') || k.includes('اساسي') || k.includes('أساسي') || k.includes('basic')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) baseSalary = num;
            } else if (k.includes('حافز') || k.includes('مكافأ') || k.includes('مكافا') || k.includes('incentive') || k.includes('bonus')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) incentiveVal = num;
            } else if (k.includes('سكن') || k.includes('housing')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) housingVal = num;
            } else if (k.includes('مواصلات') || k.includes('انتقال') || k.includes('transport')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) transportVal = num;
            } else if (k.includes('بدل') || k.includes('allowance')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) allowancesVal = num;
            } else if (k.includes('حصةالعامل') || k.includes('حصهالعامل') || k.includes('تامينالعامل') || k.includes('تأمينالعامل') || k.includes('employeeshare')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) employeeInsuranceShare = num;
            } else if (k.includes('حصةصاحبالعمل') || k.includes('حصهصاحبالعمل') || k.includes('حصةالشركة') || k.includes('حصهالشركة') || k.includes('تامينالمنشأة') || k.includes('employershare')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) employerInsuranceShare = num;
            } else if (k.includes('ضريب') || k.includes('ضرائب') || k.includes('tax') || k.includes('كسبالعمل')) {
              const num = parseFloat(v.replace(/[^0-9.]/g, ''));
              if (!isNaN(num)) taxAmount = num;
            } else if (k.includes('رقم') && (k.includes('تامين') || k.includes('تأمين') || k.includes('insurance'))) {
              insuranceNumber = v;
            } else if (k.includes('تامين') || k.includes('تأمين') || k.includes('خاضع') || k === 'التأمينات' || k === 'التامينات') {
              insuranceStatus = v;
            } else if ((k.includes('اسم') && (k.includes('بنك') || k.includes('bank'))) || k === 'البنك' || k === 'بنك' || k === 'bank') {
              bankName = v;
            } else if (k.includes('حساب') || k.includes('iban') || k.includes('آيبان') || k.includes('ايبان') || k.includes('account') || k.includes('حساببنكي')) {
              bankAccount = v;
            } else if (k.includes('هوية') || k.includes('إقامة') || k.includes('اقامة') || k.includes('انتهاء') || k.includes('صلاحية') || k.includes('expiry') || k.includes('iqama')) {
              iqamaExpiryDate = parseExcelDate(val);
            } else if (k.includes('حالة') || k.includes('status')) {
              statusStr = v;
            }
          }

          if (!employeeCode) {
            for (const [key, val] of Object.entries(row)) {
              if (/code|id|رقم|كود/i.test(key)) {
                employeeCode = String(val).trim();
                break;
              }
            }
          }

          if (!name && !employeeCode) return;

          const cleanCode = employeeCode.replace(/\D/g, '') || employeeCode || `${Date.now() + idx}`;
          const finalCode = employeeCode || cleanCode;
          const finalName = name || `موظف رقم (${cleanCode})`;

          // Ensure department matches exact 10 departments if close match
          if (departments && departments.length > 0) {
            const matchedDept = departments.find((d) => d.name.trim() === department.trim());
            if (matchedDept) {
              department = matchedDept.name;
            } else {
              const fuzzyDept = departments.find((d) => d.name.includes(department.trim()) || department.includes(d.name));
              if (fuzzyDept) {
                department = fuzzyDept.name;
              }
            }
          }

          let finalStatus: 'active' | 'on_leave' | 'suspended' | 'resigned' = 'active';
          const sLower = statusStr.toLowerCase();
          if (sLower.includes('إجازة') || sLower.includes('اجازة') || sLower.includes('leave')) {
            finalStatus = 'on_leave';
          } else if (sLower.includes('موقف') || sLower.includes('معلق') || sLower.includes('suspended')) {
            finalStatus = 'suspended';
          } else if (sLower.includes('استقال') || sLower.includes('منتهي') || sLower.includes('متوقف') || sLower.includes('غير نشط') || sLower.includes('resigned') || sLower.includes('terminated')) {
            finalStatus = 'resigned';
          }

          const combinedOtherAllowances = (allowancesVal || 0) + (incentiveVal || 0);

          const newEmpItem: Employee = {
            id: `emp-dat-${cleanCode}`,
            employeeCode: finalCode,
            name: finalName,
            position: position || 'موظف',
            department: department || 'تكنولوجيا المعلومات',
            email: '',
            phone: phone || '',
            avatar: '',
            baseSalary: baseSalary || 0,
            housingAllowance: housingVal || 0,
            transportAllowance: transportVal || 0,
            otherAllowances: combinedOtherAllowances || 0,
            gosiInsurance: employeeInsuranceShare || 0,
            iqamaOrIdNumber: nationalId || finalCode,
            iqamaExpiryDate: iqamaExpiryDate || '',
            contractType: 'مصري',
            contractExpiryDate: '',
            joinDate: joinDate || new Date().toISOString().split('T')[0],
            status: finalStatus,
            bankName: bankName || '',
            bankAccount: bankAccount || '',
            birthDate: birthDate || '',
            nationalId: nationalId || '',
            insuranceNumber: insuranceNumber || '',
            insuranceStatus: insuranceStatus || 'خاضع للتأمين',
            employeeInsuranceShare: employeeInsuranceShare || 0,
            employerInsuranceShare: employerInsuranceShare || 0,
            taxAmount: taxAmount || 0,
            militaryStatus: militaryStatus || 'أدى الخدمة',
            maritalStatus: maritalStatus || 'أعزب',
            address: address || '',
          };

          parsedList.push(newEmpItem);
        });

        if (parsedList.length === 0) {
          setImportStatusMsg({ type: 'error', text: 'لم يتم التعرف على أي بيانات موظفين صالحة في الملف.' });
        } else {
          setImportStatusMsg({ type: 'success', text: `تم التعرف على ${parsedList.length} موظف بنجاح.` });
        }
        setParsedImportEmps(parsedList);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setImportStatusMsg({ type: 'error', text: 'حدث خطأ أثناء قراءة ملف Excel. يرجى التأكد من بصيغة الملف.' });
        setParsedImportEmps([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Submit Bulk Import
  const handleConfirmImport = () => {
    if (parsedImportEmps.length === 0) return;
    parsedImportEmps.forEach((emp) => {
      onAddEmployee(emp);
    });
    setImportStatusMsg({
      type: 'success',
      text: `تم استيراد وحفظ ${parsedImportEmps.length} موظف بنجاح في قاعدة البيانات!`,
    });
    setTimeout(() => {
      setShowExcelImportModal(false);
      setParsedImportEmps([]);
      setExcelFile(null);
      setImportStatusMsg(null);
    }, 1200);
  };

  // New Employee Form State
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    employeeCode: '',
    name: '',
    position: '',
    department: 'تكنولوجيا المعلومات',
    email: '',
    phone: '',
    baseSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    gosiInsurance: 0,
    iqamaOrIdNumber: '',
    iqamaExpiryDate: '',
    contractType: 'مصري',
    contractExpiryDate: '',
    joinDate: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccount: '',
    status: 'active',
    birthDate: '',
    nationalId: '',
    insuranceNumber: '',
    insuranceStatus: 'خاضع للتأمين',
    employeeInsuranceShare: 0,
    employerInsuranceShare: 0,
    taxAmount: 0,
    militaryStatus: 'أدى الخدمة',
    maritalStatus: 'أعزب',
    address: '',
  });
  const [initialAssetCode, setInitialAssetCode] = useState<string>('');

  // Filter & Deduplicate Employees
  const uniqueEmployeesMap = new Map<string, Employee>();
  employees.forEach((emp) => {
    if (!emp) return;
    const key = emp.id || emp.employeeCode;
    if (key && !uniqueEmployeesMap.has(key)) {
      uniqueEmployeesMap.set(key, emp);
    }
  });
  const uniqueEmployees = Array.from(uniqueEmployeesMap.values());

  const filteredEmployees = uniqueEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.includes(searchTerm) ||
      emp.employeeCode.includes(searchTerm) ||
      emp.position.includes(searchTerm) ||
      (emp.nationalId && emp.nationalId.includes(searchTerm)) ||
      (emp.phone && emp.phone.includes(searchTerm)) ||
      (emp.insuranceNumber && emp.insuranceNumber.includes(searchTerm)) ||
      emp.iqamaOrIdNumber.includes(searchTerm);

    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.position) return;

    const natId = newEmp.nationalId || newEmp.iqamaOrIdNumber || '';
    const empShare = Number(newEmp.employeeInsuranceShare !== undefined ? newEmp.employeeInsuranceShare : newEmp.gosiInsurance) || 0;

    const created: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: newEmp.employeeCode?.trim() || `SHR-${Math.floor(100 + Math.random() * 900)}`,
      name: newEmp.name || '',
      position: newEmp.position || '',
      department: newEmp.department || 'تكنولوجيا المعلومات',
      email: newEmp.email || '',
      phone: newEmp.phone || '',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      baseSalary: Number(newEmp.baseSalary) || 0,
      housingAllowance: Number(newEmp.housingAllowance) || 0,
      transportAllowance: Number(newEmp.transportAllowance) || 0,
      otherAllowances: Number(newEmp.otherAllowances) || 0,
      gosiInsurance: empShare,
      iqamaOrIdNumber: natId,
      iqamaExpiryDate: newEmp.iqamaExpiryDate || '',
      contractType: (newEmp.contractType as any) || 'مصري',
      contractExpiryDate: newEmp.contractExpiryDate || '',
      joinDate: newEmp.joinDate || new Date().toISOString().split('T')[0],
      status: (newEmp.status as any) || 'active',
      bankAccount: newEmp.bankAccount || '',
      bankName: newEmp.bankName || '',
      birthDate: newEmp.birthDate || '',
      nationalId: natId,
      insuranceNumber: newEmp.insuranceNumber || '',
      insuranceStatus: newEmp.insuranceStatus || 'خاضع للتأمين',
      employeeInsuranceShare: empShare,
      employerInsuranceShare: Number(newEmp.employerInsuranceShare) || 0,
      taxAmount: Number(newEmp.taxAmount) || 0,
      militaryStatus: newEmp.militaryStatus || 'أدى الخدمة',
      maritalStatus: newEmp.maritalStatus || 'أعزب',
      address: newEmp.address || '',
    };

    onAddEmployee(created, initialAssetCode);
    setShowAddModal(false);
    setNewEmp({
      employeeCode: '',
      name: '',
      position: '',
      department: 'تكنولوجيا المعلومات',
      email: '',
      phone: '',
      baseSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      gosiInsurance: 0,
      iqamaOrIdNumber: '',
      iqamaExpiryDate: '',
      contractType: 'مصري',
      contractExpiryDate: '',
      joinDate: new Date().toISOString().split('T')[0],
      bankName: '',
      bankAccount: '',
      status: 'active',
      birthDate: '',
      nationalId: '',
      insuranceNumber: '',
      insuranceStatus: 'خاضع للتأمين',
      employeeInsuranceShare: 0,
      employerInsuranceShare: 0,
      taxAmount: 0,
      militaryStatus: 'أدى الخدمة',
      maritalStatus: 'أعزب',
      address: '',
    });
    setInitialAssetCode('');
  };

  // Document Expiry Helper
  const getExpiryBadge = (expiryDateStr: string) => {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { label: 'منتهٍ!', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' };
    } else if (diffDays <= 30) {
      return { label: `ينتهي خلال ${diffDays} يومًا`, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
    } else {
      return { label: 'سارٍ', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* View Header & Action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>إدارة الموظفين والملفات الشاملة</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل كادر العمل، الهياكل والرواتب، متابعة انتهاء العقود والإقامات والعهد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="import-excel-modal-btn"
            onClick={() => setShowExcelImportModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد من إكسل (Excel)</span>
          </button>

          <button
            id="add-employee-modal-open-btn"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-sm shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد (Onboarding)</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الوظيفي..."
              className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
          >
            <option value="all">جميع الأقسام ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            جدول مفصل
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            بطاقات
          </button>
        </div>
      </div>

      {/* Employees Table Mode */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-right text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">الكود</th>
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">الرقم القومي</th>
                <th className="p-3.5">تاريخ الميلاد</th>
                <th className="p-3.5">تاريخ التعيين</th>
                <th className="p-3.5">الحالة الاجتماعية</th>
                <th className="p-3.5">الخدمة العسكرية</th>
                <th className="p-3.5">العنوان</th>
                <th className="p-3.5">التليفون</th>
                <th className="p-3.5">القسم والوظيفة</th>
                <th className="p-3.5">الراتب الأساسي</th>
                <th className="p-3.5">البدلات</th>
                <th className="p-3.5">التأمينات</th>
                <th className="p-3.5">الرقم التأميني</th>
                <th className="p-3.5 text-rose-600 dark:text-rose-400">حصة العامل</th>
                <th className="p-3.5 text-indigo-600 dark:text-indigo-400">حصة صاحب العمل</th>
                <th className="p-3.5 text-amber-600 dark:text-amber-400">الضريبة</th>
                <th className="p-3.5">الحساب البنكي</th>
                <th className="p-3.5">صلاحية الهوية</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center sticky left-0 bg-slate-50 dark:bg-slate-900 shadow-xs">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredEmployees.map((emp) => {
                const totalAllowances = emp.housingAllowance + emp.transportAllowance + emp.otherAllowances;
                const iqamaBadge = getExpiryBadge(emp.iqamaExpiryDate);
                const empShare = emp.employeeInsuranceShare !== undefined ? emp.employeeInsuranceShare : emp.gosiInsurance;

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="p-3.5 font-bold font-mono text-blue-600 dark:text-blue-400">
                      {emp.employeeCode}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.email || emp.phone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {emp.nationalId || emp.iqamaOrIdNumber || '—'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {emp.birthDate || '—'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {emp.joinDate || '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                        {emp.maritalStatus || 'أعزب'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
                        {emp.militaryStatus || 'أدى الخدمة'}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-[160px] truncate text-slate-600 dark:text-slate-400" title={emp.address || ''}>
                      {emp.address || '—'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold" dir="ltr">
                      {emp.phone || '—'}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{emp.position}</p>
                      <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md mt-0.5">
                        {emp.department}
                      </span>
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                      {emp.baseSalary.toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      +{totalAllowances.toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (emp.insuranceStatus || 'خاضع للتأمين') === 'خاضع للتأمين'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {emp.insuranceStatus || 'خاضع للتأمين'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {emp.insuranceNumber || '—'}
                    </td>
                    <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">
                      {(empShare || 0).toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {(emp.employerInsuranceShare || 0).toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5 font-bold text-amber-600 dark:text-amber-400">
                      {(emp.taxAmount || 0).toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5">
                      {emp.bankAccount ? (
                        <div>
                          <p className="font-mono text-xs text-slate-800 dark:text-slate-200">{emp.bankAccount}</p>
                          <p className="text-[10px] text-slate-400">{emp.bankName || 'حساب بنكي'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${iqamaBadge.color}`}>
                        {iqamaBadge.label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        emp.status === 'on_leave' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        emp.status === 'suspended' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {emp.status === 'active' ? 'على رأس العمل' :
                         emp.status === 'on_leave' ? 'في إجازة' :
                         emp.status === 'suspended' ? 'موقوف موقتاً' :
                         'ترك العمل'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center sticky left-0 bg-white/95 dark:bg-slate-800/95 shadow-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`view-profile-btn-${emp.id}`}
                          onClick={() => setActiveProfileEmployee(emp)}
                          className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>الملف</span>
                        </button>
                        <button
                          id={`edit-employee-btn-${emp.id}`}
                          onClick={() => setEditEmpForm(emp)}
                          className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1 text-[11px]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          id={`delete-employee-btn-${emp.id}`}
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Employees Grid Cards Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const totalSalary = emp.baseSalary + emp.housingAllowance + emp.transportAllowance + emp.otherAllowances;

            return (
              <div
                key={emp.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg ring-2 ring-blue-500/20">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{emp.name}</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{emp.position}</p>
                      <p className="text-[10px] text-slate-400">{emp.department}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {emp.employeeCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      emp.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      emp.status === 'on_leave' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      emp.status === 'suspended' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {emp.status === 'active' ? 'على رأس العمل' :
                       emp.status === 'on_leave' ? 'في إجازة' :
                       emp.status === 'suspended' ? 'موقوف موقتاً' :
                       'ترك العمل'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">الإجمالي المستحق</span>
                    <p className="font-extrabold text-slate-900 dark:text-white">{totalSalary.toLocaleString()} {currencySymbol}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">نوع العقد</span>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{emp.contractType}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveProfileEmployee(emp)}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>الملف الشامل</span>
                  </button>
                  <button
                    onClick={() => setEditEmpForm(emp)}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => onDeleteEmployee(emp.id)}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Employee Profile Modal */}
      {activeProfileEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl ring-4 ring-blue-500/20">
                  {activeProfileEmployee.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeProfileEmployee.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {activeProfileEmployee.employeeCode}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {activeProfileEmployee.position} - {activeProfileEmployee.department}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    تاريخ الانضمام: {activeProfileEmployee.joinDate} | نوع العقد: {activeProfileEmployee.contractType}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveProfileEmployee(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content Tabs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Personal & Identification Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>البيانات الشخصية والقومية</span>
                </h4>

                <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">الرقم القومي:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{activeProfileEmployee.nationalId || activeProfileEmployee.iqamaOrIdNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">تاريخ الميلاد:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{activeProfileEmployee.birthDate || '—'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">الحالة الاجتماعية:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfileEmployee.maritalStatus || 'أعزب'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">موقف الخدمة العسكرية:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{activeProfileEmployee.militaryStatus || 'أدى الخدمة'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">رقم الهاتف:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200" dir="ltr">{activeProfileEmployee.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">العنوان بالتفصيل:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-left">{activeProfileEmployee.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Insurance & Taxes Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>التأمينات الاجتماعية والضرائب</span>
                </h4>

                <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">حالة التأمينات:</span>
                    <span className="font-bold text-emerald-600">{activeProfileEmployee.insuranceStatus || 'خاضع للتأمين'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">الرقم التأميني:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{activeProfileEmployee.insuranceNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">حصة العامل من التأمينات:</span>
                    <span className="font-bold text-rose-600">
                      -{(activeProfileEmployee.employeeInsuranceShare !== undefined ? activeProfileEmployee.employeeInsuranceShare : activeProfileEmployee.gosiInsurance).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">حصة صاحب العمل (الشركة):</span>
                    <span className="font-bold text-indigo-600">
                      {(activeProfileEmployee.employerInsuranceShare || 0).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">الضريبة المستقطعة:</span>
                    <span className="font-bold text-amber-600">
                      -{(activeProfileEmployee.taxAmount || 0).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">بيانات البنك والحساب:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {activeProfileEmployee.bankName ? `${activeProfileEmployee.bankName} - ` : ''}{activeProfileEmployee.bankAccount || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>الهيكل المالي والراتب الصافي</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">الراتب الأساسي:</span>
                    <span className="font-extrabold">{activeProfileEmployee.baseSalary.toLocaleString()} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الحوافز والبدلات:</span>
                    <span className="font-bold text-emerald-600">+{activeProfileEmployee.housingAllowance.toLocaleString()} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">بدل المواصلات:</span>
                    <span className="font-bold text-emerald-600">+{activeProfileEmployee.transportAllowance.toLocaleString()} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">بدلات أخرى:</span>
                    <span className="font-bold text-emerald-600">+{activeProfileEmployee.otherAllowances.toLocaleString()} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">خصم التأمينات الاجتماعية (حصة العامل):</span>
                    <span className="font-bold text-rose-500">
                      -{(activeProfileEmployee.employeeInsuranceShare !== undefined ? activeProfileEmployee.employeeInsuranceShare : activeProfileEmployee.gosiInsurance).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">خصم الضريبة:</span>
                    <span className="font-bold text-amber-500">
                      -{(activeProfileEmployee.taxAmount || 0).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-600 text-sm font-extrabold">
                    <span>صافي الراتب المتوقع:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {(
                        activeProfileEmployee.baseSalary +
                        activeProfileEmployee.housingAllowance +
                        activeProfileEmployee.transportAllowance +
                        activeProfileEmployee.otherAllowances -
                        (activeProfileEmployee.employeeInsuranceShare !== undefined ? activeProfileEmployee.employeeInsuranceShare : activeProfileEmployee.gosiInsurance) -
                        (activeProfileEmployee.taxAmount || 0)
                      ).toLocaleString()}{' '}
                      {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents & Expiry Dates */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>المستندات والصلاحية الرسمية</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">تاريخ التعيين والالتحاق:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{activeProfileEmployee.joinDate || '—'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">انتهاء الهوية/جواز السفر</span>
                      <span className="font-bold">{activeProfileEmployee.iqamaExpiryDate || 'غير محدد'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getExpiryBadge(activeProfileEmployee.iqamaExpiryDate).color}`}>
                      {getExpiryBadge(activeProfileEmployee.iqamaExpiryDate).label}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">انتهاء عقد العمل</span>
                      <span className="font-bold">{activeProfileEmployee.contractExpiryDate || 'غير محدد'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getExpiryBadge(activeProfileEmployee.contractExpiryDate).color}`}>
                      {getExpiryBadge(activeProfileEmployee.contractExpiryDate).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Assets & Custody */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3 md:col-span-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                  <Laptop className="w-4 h-4 text-purple-600" />
                  <span>العهد والأصول المسجلة بحوزته</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {assets
                    .filter((a) => a.assignedToEmployeeId === activeProfileEmployee.id)
                    .map((asset) => (
                      <div
                        key={asset.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{asset.assetName}</p>
                          <p className="text-[10px] text-slate-400">{asset.assetCode} | S/N: {asset.serialNumber}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          {asset.condition}
                        </span>
                      </div>
                    ))}
                  {assets.filter((a) => a.assignedToEmployeeId === activeProfileEmployee.id).length === 0 && (
                    <p className="text-slate-400 text-xs py-2 col-span-2">لا توجد أصول مسجلة بحوزة الموظف حالياً.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setActiveProfileEmployee(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEmployee}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in relative z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>تسجيل موظف جديد (Onboarding)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الكود التوظيفي / الرقم الوظيفي</label>
                <input
                  type="text"
                  value={newEmp.employeeCode || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, employeeCode: e.target.value })}
                  placeholder="مثال: SHR-105 (تلقائي إذا ترك فارغاً)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الاسم الرباعي للموظف *</label>
                <input
                  required
                  type="text"
                  value={newEmp.name || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  placeholder="مثال: أحمد عبد الفتاح الشناوي"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">المسمى الوظيفي *</label>
                <input
                  required
                  type="text"
                  value={newEmp.position || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                  placeholder="مثال: مهندس برمجيات"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="font-bold text-slate-700 dark:text-slate-300">القسم التنظيمي</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNewDeptDropdown(!showNewDeptDropdown)}
                    className="w-full text-right p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-xs"
                  >
                    <span>{newEmp.department || 'اختر القسم'}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showNewDeptDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showNewDeptDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {departments.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setNewEmp({ ...newEmp, department: d.name });
                            setShowNewDeptDropdown(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-200"
                        >
                          {d.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">حالة العمل</label>
                <select
                  value={newEmp.status || 'active'}
                  onChange={(e) => setNewEmp({ ...newEmp, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                >
                  <option value="active">على رأس العمل</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="suspended">موقوف موقتاً</option>
                  <option value="resigned">ترك العمل</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                <input
                  type="text"
                  value={newEmp.phone || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  placeholder="مثال: +20 100 000 0000"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">تاريخ التعيين</label>
                <input
                  type="date"
                  value={newEmp.joinDate || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, joinDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الراتب الأساسي ({currencySymbol})</label>
                <input
                  type="number"
                  value={newEmp.baseSalary || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, baseSalary: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل الراتب الأساسي..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الحوافز والبدلات ({currencySymbol})</label>
                <input
                  type="number"
                  value={newEmp.housingAllowance || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, housingAllowance: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل الحوافز والبدلات..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">بدل المواصلات ({currencySymbol})</label>
                <input
                  type="number"
                  value={newEmp.transportAllowance || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, transportAllowance: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل بدل المواصلات..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">بدلات أخرى ({currencySymbol})</label>
                <input
                  type="number"
                  value={newEmp.otherAllowances || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, otherAllowances: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل بدلات أخرى..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">تأمين اجتماعي مستقطع ({currencySymbol})</label>
                <input
                  type="number"
                  value={newEmp.gosiInsurance || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, gosiInsurance: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل التأمين الاجتماعي المستقطع..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">اسم البنك</label>
                <input
                  type="text"
                  value={newEmp.bankName || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, bankName: e.target.value })}
                  placeholder="أدخل اسم البنك..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">رقم الحساب البنكي / IBAN</label>
                <input
                  type="text"
                  value={newEmp.bankAccount || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, bankAccount: e.target.value })}
                  placeholder="أدخل رقم الحساب البنكي أو الـ IBAN..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الرقم القومي / جواز السفر</label>
                <input
                  type="text"
                  value={newEmp.iqamaOrIdNumber || ''}
                  onChange={(e) => setNewEmp({ ...newEmp, iqamaOrIdNumber: e.target.value })}
                  placeholder="الرقم القومي (14 رقم)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">تسليم عهدة أولية (اختياري)</label>
                <input
                  type="text"
                  value={initialAssetCode}
                  onChange={(e) => setInitialAssetCode(e.target.value)}
                  placeholder="مثال: لابتوب ديل XPS 15"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                حفظ وإضافة الموظف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmpForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editEmpForm.name || !editEmpForm.position) return;
              onUpdateEmployee(editEmpForm);
              setEditEmpForm(null);
            }}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in relative z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>تعديل بيانات الموظف: {editEmpForm.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditEmpForm(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الكود التوظيفي / الرقم الوظيفي *</label>
                <input
                  required
                  type="text"
                  value={editEmpForm.employeeCode}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, employeeCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الاسم الرباعي للموظف *</label>
                <input
                  required
                  type="text"
                  value={editEmpForm.name}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">المسمى الوظيفي *</label>
                <input
                  required
                  type="text"
                  value={editEmpForm.position}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, position: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="font-bold text-slate-700 dark:text-slate-300">القسم التنظيمي</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEditDeptDropdown(!showEditDeptDropdown)}
                    className="w-full text-right p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors text-xs"
                  >
                    <span>{editEmpForm.department || 'اختر القسم'}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showEditDeptDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showEditDeptDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {departments.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setEditEmpForm({ ...editEmpForm, department: d.name });
                            setShowEditDeptDropdown(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-200"
                        >
                          {d.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>



              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">حالة العمل</label>
                <select
                  value={editEmpForm.status}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                >
                  <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">على رأس العمل</option>
                  <option value="on_leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">في إجازة</option>
                  <option value="suspended" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">موقوف موقتاً</option>
                  <option value="resigned" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">ترك العمل</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                <input
                  type="text"
                  value={editEmpForm.phone || ''}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">تاريخ التعيين</label>
                <input
                  type="date"
                  value={editEmpForm.joinDate}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, joinDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>



              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الراتب الأساسي ({currencySymbol})</label>
                <input
                  type="number"
                  value={editEmpForm.baseSalary}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, baseSalary: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الحوافز والبدلات ({currencySymbol})</label>
                <input
                  type="number"
                  value={editEmpForm.housingAllowance}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, housingAllowance: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">بدل المواصلات ({currencySymbol})</label>
                <input
                  type="number"
                  value={editEmpForm.transportAllowance}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, transportAllowance: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">بدلات أخرى ({currencySymbol})</label>
                <input
                  type="number"
                  value={editEmpForm.otherAllowances}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, otherAllowances: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">تأمين اجتماعي مستقطع ({currencySymbol})</label>
                <input
                  type="number"
                  value={editEmpForm.gosiInsurance}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, gosiInsurance: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">اسم البنك</label>
                <input
                  type="text"
                  value={editEmpForm.bankName}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, bankName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">رقم الحساب البنكي / IBAN</label>
                <input
                  type="text"
                  value={editEmpForm.bankAccount}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, bankAccount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">الرقم القومي / جواز السفر</label>
                <input
                  type="text"
                  value={editEmpForm.iqamaOrIdNumber}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, iqamaOrIdNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditEmpForm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    استيراد بيانات الموظفين من ملف Excel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    يمكنك رفع ملف (.xlsx, .xls, .csv) يحتوي على بيانات الكادر لترفيقها مباشرة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExcelImportModal(false);
                  setParsedImportEmps([]);
                  setExcelFile(null);
                  setImportStatusMsg(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download and Instructions */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>الأعمدة المدعومة في نموذج ملف الإكسيل المعتمد:</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold">
                      قائمة منسدلة للأقسام الـ 10
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    اسم الموظف • الكود الوظيفي • <strong className="text-blue-600 dark:text-blue-400">القسم (قائمة منسدلة للـ 10 أقسام المعتمدة في النظام)</strong> • الوظيفة • <strong className="text-emerald-600 dark:text-emerald-400">الراتب الأساسي</strong> • <strong className="text-emerald-600 dark:text-emerald-400">الحافز</strong> • <strong className="text-emerald-600 dark:text-emerald-400">البدلات</strong> • صلاحية الهوية • الحالة
                  </p>
                </div>
                <button
                  id="download-excel-template-btn"
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>تحميل نموذج Excel المعتمد (مع قائمة الأقسام)</span>
                </button>
              </div>
            </div>

            {/* File Upload Drop Zone */}
            <div className="space-y-3">
              <input
                type="file"
                ref={excelInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileChange}
                className="hidden"
              />
              <div
                onClick={() => excelInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/20 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {excelFile ? `الملف المحدد: ${excelFile.name}` : 'اضغط هنا لاختيار ملف Excel أو قم بسحبه وإسقاطه'}
                </p>
                <p className="text-[10px] text-slate-400">يدعم صيغ Excel (.xlsx, .xls, .csv)</p>
              </div>
            </div>

            {/* Status Message */}
            {importStatusMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                  importStatusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {importStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{importStatusMsg.text}</span>
              </div>
            )}

            {/* Parsed Employees Preview Table */}
            {parsedImportEmps.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    معاينة البيانات التي تم التعرف عليها ({parsedImportEmps.length} موظف):
                  </h4>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">الكود</th>
                        <th className="p-2.5">الاسم</th>
                        <th className="p-2.5">القسم</th>
                        <th className="p-2.5">الوظيفة</th>
                        <th className="p-2.5">الراتب الأساسي</th>
                        <th className="p-2.5 text-emerald-600 dark:text-emerald-400">البدلات</th>
                        <th className="p-2.5">إجمالي الراتب</th>
                        <th className="p-2.5">التأمينات</th>
                        <th className="p-2.5">حصة العامل</th>
                        <th className="p-2.5">صلاحية الهوية</th>
                        <th className="p-2.5 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedImportEmps.map((emp, idx) => {
                        const totalAllowances = emp.housingAllowance + emp.transportAllowance + emp.otherAllowances;
                        const totalSalary = emp.baseSalary + totalAllowances;
                        const empShare = emp.employeeInsuranceShare !== undefined ? emp.employeeInsuranceShare : emp.gosiInsurance;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 whitespace-nowrap">
                            <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {emp.employeeCode}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{emp.name}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">{emp.department}</td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">{emp.position}</td>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                              {emp.baseSalary.toLocaleString()} {currencySymbol}
                            </td>
                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                              +{totalAllowances.toLocaleString()} {currencySymbol}
                            </td>
                            <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                              {totalSalary.toLocaleString()} {currencySymbol}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono">
                              {emp.insuranceStatus || 'خاضع للتأمين'}
                            </td>
                            <td className="p-2.5 text-rose-600 dark:text-rose-400 font-bold font-mono">
                              -{empShare.toLocaleString()} {currencySymbol}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono">
                              {emp.iqamaExpiryDate || '—'}
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  emp.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : emp.status === 'on_leave'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {emp.status === 'active' ? 'نشط' : emp.status === 'on_leave' ? 'إجازة' : 'متوقف/غير نشط'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowExcelImportModal(false);
                  setParsedImportEmps([]);
                  setExcelFile(null);
                  setImportStatusMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={parsedImportEmps.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد واستيراد ({parsedImportEmps.length}) موظف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
