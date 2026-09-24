import React, { useState } from 'react';
import {
  Briefcase,
  DollarSign,
  Laptop,
  Plus,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Car,
  Monitor,
  User,
  X,
  Edit3,
  Trash2,
  Printer,
  Download
} from 'lucide-react';
import { Loan, Asset, Employee } from '../types';

interface LoansAssetsViewProps {
  loans: Loan[];
  assets: Asset[];
  employees: Employee[];
  onAddLoan: (loan: Loan) => void;
  onAddAsset: (asset: Asset) => void;
  onAssignAsset: (assetId: string, employeeId?: string, employeeName?: string) => void;
  onUpdateLoan?: (loan: Loan) => void;
  onDeleteLoan?: (loanId: string) => void;
  onUpdateAsset?: (asset: Asset) => void;
  onDeleteAsset?: (assetId: string) => void;
  currencySymbol: string;
}

export const LoansAssetsView: React.FC<LoansAssetsViewProps> = ({
  loans,
  assets,
  employees,
  onAddLoan,
  onAddAsset,
  onAssignAsset,
  onUpdateLoan,
  onDeleteLoan,
  onUpdateAsset,
  onDeleteAsset,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'assets'>('loans');

  const exportLoansToExcel = () => {
    const headers = [
      'اسم الموظف',
      'مبلغ السلفة الإجمالي',
      'المسدد',
      'المتبقي',
      'القسط الشهري',
      'تاريخ البدء',
      'ملاحظات',
      'الحالة'
    ];

    const rows = loans.map((loan) => [
      loan.employeeName,
      loan.totalAmount,
      loan.paidAmount,
      loan.remainingAmount,
      loan.monthlyInstallment,
      loan.startDate,
      loan.notes || '',
      loan.status === 'active' || loan.status === 'نشط' ? 'نشطة' : 'مكتملة'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'سجل_السلف_والقروض.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printLoansTable = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = loans.map((loan) => `
      <tr>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">${loan.employeeName}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${loan.totalAmount.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; color:#16a34a;">${loan.paidAmount.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; color:#d97706;">${loan.remainingAmount.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${loan.monthlyInstallment.toLocaleString()} ${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:center;">${loan.startDate}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">${loan.notes || '-'}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:center;">${loan.status === 'active' || loan.status === 'نشط' ? 'نشطة' : 'مكتملة'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>سجل السلف والقروض</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; border: 1px solid #ccc; padding: 10px; text-align: right; }
            .meta { margin-bottom: 20px; font-size: 14px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h2>كشف سجل السلف والقروض والقسط الشهري</h2>
          <div class="meta">تاريخ الطباعة: \${new Date().toLocaleDateString('ar-EG')} | إجمالي السلف: \${loans.length}</div>
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>المبلغ الإجمالي</th>
                <th>المسدد حتى الآن</th>
                <th>المبلغ المتبقي</th>
                <th>القسط الشهري</th>
                <th>تاريخ البدء</th>
                <th>ملاحظات</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              \${tableRows}
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

  const exportAssetsToExcel = () => {
    const headers = [
      'كود الأصل',
      'اسم الأصل / العهدة',
      'الفئة',
      'الرقم التسلسلي',
      'الحالة والموقع',
      'بحوزة الموظف',
      'القيمة التقديرية',
      'حالة الأصل المادية'
    ];

    const rows = assets.map((ast) => [
      ast.assetCode,
      ast.assetName,
      ast.category,
      ast.serialNumber,
      ast.status,
      ast.assignedToName || 'المخزن',
      ast.value,
      ast.condition
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'سجل_العهد_والأصول.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printAssetsTable = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = assets.map((ast) => `
      <tr>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${ast.assetCode}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold;">\${ast.assetName}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${ast.category}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${ast.serialNumber}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:center;">\${ast.status}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right; font-weight:bold; color:#2563eb;">\${ast.assignedToName || 'المخزن (غير مسند)'}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:right;">\${ast.value.toLocaleString()} \${currencySymbol}</td>
        <td style="border:1px solid #ccc; padding:8px; text-align:center;">\${ast.condition}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>سجل العهد والأصول</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; color: #7c3aed; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; border: 1px solid #ccc; padding: 10px; text-align: right; }
            .meta { margin-bottom: 20px; font-size: 14px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h2>كشف سجل العهد والأصول المسلمة للموظفين</h2>
          <div class="meta">تاريخ الطباعة: \${new Date().toLocaleDateString('ar-EG')} | إجمالي الأصول: \${assets.length}</div>
          <table>
            <thead>
              <tr>
                <th>كود الأصل</th>
                <th>اسم الأصل / العهدة</th>
                <th>الفئة</th>
                <th>الرقم التسلسلي</th>
                <th>الموقع الحالي</th>
                <th>بحوزة الموظف</th>
                <th>القيمة التقديرية</th>
                <th>الحالة المادية</th>
              </tr>
            </thead>
            <tbody>
              \${tableRows}
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

  // Edit Loan & Asset States
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  // New Loan Modal
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    employeeId: employees[0]?.id || '',
    totalAmount: 0,
    monthlyInstallment: 0,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // New Asset Modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    assetName: '',
    assetCode: '',
    category: '',
    serialNumber: '',
    condition: 'جديد',
    status: 'المخزن',
    value: 0,
  });

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === newLoan.employeeId);
    if (!emp) return;

    const created: Loan = {
      id: `loan-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      totalAmount: Number(newLoan.totalAmount),
      paidAmount: 0,
      remainingAmount: Number(newLoan.totalAmount),
      monthlyInstallment: Number(newLoan.monthlyInstallment),
      startDate: newLoan.startDate,
      endDate: '2027-08-01',
      status: 'active',
      notes: newLoan.notes,
    };

    onAddLoan(created);
    setNewLoan({
      employeeId: employees[0]?.id || '',
      totalAmount: 0,
      monthlyInstallment: 0,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowLoanModal(false);
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.assetName) return;

    const created: Asset = {
      id: `ast-${Date.now()}`,
      assetName: newAsset.assetName,
      assetCode: newAsset.assetCode || `AST-${Date.now().toString().slice(-4)}`,
      category: newAsset.category as any || 'عام',
      serialNumber: newAsset.serialNumber || '-',
      condition: newAsset.condition as any || 'جديد',
      status: 'المخزن',
      value: Number(newAsset.value) || 0,
    };

    onAddAsset(created);
    setNewAsset({
      assetName: '',
      assetCode: '',
      category: '',
      serialNumber: '',
      condition: 'جديد',
      status: 'المخزن',
      value: 0,
    });
    setShowAssetModal(false);
  };

  const handleSaveEditLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLoan) return;

    const emp = employees.find((e) => e.id === editLoan.employeeId);
    if (!emp) return;

    const updated: Loan = {
      ...editLoan,
      employeeName: emp.name,
      totalAmount: Number(editLoan.totalAmount),
      remainingAmount: Number(editLoan.totalAmount) - editLoan.paidAmount,
      monthlyInstallment: Number(editLoan.monthlyInstallment),
    };

    if (onUpdateLoan) {
      onUpdateLoan(updated);
    }
    setEditLoan(null);
  };

  const handleSaveEditAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAsset || !editAsset.assetName) return;

    if (onUpdateAsset) {
      onUpdateAsset(editAsset);
    }
    setEditAsset(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'لاب توب':
        return Laptop;
      case 'هاتف ذكي':
        return Smartphone;
      case 'سيارة':
        return Car;
      default:
        return Monitor;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <span>إدارة السلف والخصومات والعهد والأصول</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل أقساط السلف والخصم التلقائي من كشف المرتبات، وتوثيق تسليم الأجهزة والمعدات بحوزة الموظفين.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'loans'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            سجل السلف والقروض
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'assets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            سجل العهد والأصول
          </button>
        </div>
      </div>

      {activeTab === 'loans' ? (
        /* Loans Tab Content */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              السلف القائمة والأقساط الشهرية
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={exportLoansToExcel}
                className="px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100/60 transition-all cursor-pointer"
                title="تنزيل سجل السلف بصيغة Excel"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تنزيل Excel</span>
              </button>

              <button
                type="button"
                onClick={printLoansTable}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
                title="طباعة سجل السلف"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة السجل</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLoanModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل سلفة جديدة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan, idx) => {
              const percentagePaid = Math.round((loan.paidAmount / loan.totalAmount) * 100);

              return (
                <div
                  key={`loan-${loan.id}-${idx}`}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{loan.employeeName}</h4>
                      <p className="text-[11px] text-slate-400">{loan.notes}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      سلفة نشطة
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">المبلغ الإجمالي</span>
                      <span className="font-extrabold">{loan.totalAmount.toLocaleString()} {currencySymbol}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المسدد حتى الآن</span>
                      <span className="font-bold text-emerald-600">{loan.paidAmount.toLocaleString()} {currencySymbol}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المتبقي</span>
                      <span className="font-extrabold text-amber-600">{loan.remainingAmount.toLocaleString()} {currencySymbol}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">القسط الشهري الخصم التلقائي:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">-{loan.monthlyInstallment} {currencySymbol} / شهر</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percentagePaid}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setEditLoan(loan)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLoan && onDeleteLoan(loan.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Assets Tab Content */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              أصول ومعدات الشركة والعهد المسلمة
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={exportAssetsToExcel}
                className="px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100/60 transition-all cursor-pointer"
                title="تنزيل سجل العهد والأصول بصيغة Excel"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>تنزيل Excel</span>
              </button>

              <button
                type="button"
                onClick={printAssetsTable}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
                title="طباعة سجل العهد والأصول"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>طباعة السجل</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAssetModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أصل / عهدة جديدة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assets.map((ast, idx) => {
              const Icon = getCategoryIcon(ast.category);

              return (
                <div
                  key={`ast-${ast.id}-${idx}`}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{ast.assetName}</h4>
                        <p className="text-[10px] text-slate-400">{ast.assetCode} | {ast.serialNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الحالة والموقع:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{ast.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">بحوزة الموظف:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {ast.assignedToName || 'المخزن (غير مسند)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">القيمة التقديرية:</span>
                      <span className="font-extrabold">{ast.value.toLocaleString()} {currencySymbol}</span>
                    </div>
                  </div>

                  {/* Assign Controls */}
                  <div className="pt-1">
                    {ast.assignedToEmployeeId ? (
                      <button
                        onClick={() => onAssignAsset(ast.id, undefined, undefined)}
                        className="w-full py-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        استرجاع العهدة للمخزن
                      </button>
                    ) : (
                      <select
                        onChange={(e) => {
                          const emp = employees.find((emp) => emp.id === e.target.value);
                          if (emp) onAssignAsset(ast.id, emp.id, emp.name);
                        }}
                        defaultValue=""
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="" disabled>
                          -- تسليم العهدة لموظف --
                        </option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setEditAsset(ast)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAsset && onDeleteAsset(ast.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLoan}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">تسجيل طلب سلفة جديدة</h3>
              <button
                type="button"
                onClick={() => setShowLoanModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اختر الموظف *</label>
                <select
                  value={newLoan.employeeId}
                  onChange={(e) => setNewLoan({ ...newLoan, employeeId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المبلغ الإجمالي للسلفة ({currencySymbol})</label>
                <input
                  type="number"
                  value={newLoan.totalAmount || ''}
                  onChange={(e) => setNewLoan({ ...newLoan, totalAmount: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل مبلغ السلفة..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">القسط الشهري للخصم التلقائي ({currencySymbol})</label>
                <input
                  type="number"
                  value={newLoan.monthlyInstallment || ''}
                  onChange={(e) => setNewLoan({ ...newLoan, monthlyInstallment: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="أدخل قيمة القسط الشهري..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">سبب السلفة / ملاحظات</label>
                <input
                  type="text"
                  value={newLoan.notes}
                  onChange={(e) => setNewLoan({ ...newLoan, notes: e.target.value })}
                  placeholder="أدخل سبب السلفة أو أي ملاحظات..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLoanModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                إعتماد وحفظ السلفة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAsset}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">إضافة أصل / عهدة جديدة</h3>
              <button
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الأصل *</label>
                <input
                  required
                  type="text"
                  value={newAsset.assetName || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
                  placeholder="أدخل اسم الأصل أو العهدة..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الفئة</label>
                <input
                  type="text"
                  value={newAsset.category || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                  placeholder="الفئة (مثال: أجهزة إلكترونية، أثاث مكتب، سيارة)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الرقم التسلسلي (Serial Number)</label>
                <input
                  type="text"
                  value={newAsset.serialNumber || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  placeholder="أدخل الرقم التسلسلي..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">القيمة التقديرية ({currencySymbol})</label>
                <input
                  type="number"
                  value={newAsset.value || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, value: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                إضافة الأصل للمخزن
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Loan Modal */}
      {editLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditLoan}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">تعديل بيانات السلفة</h3>
              <button
                type="button"
                onClick={() => setEditLoan(null)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الموظف *</label>
                <select
                  value={editLoan.employeeId}
                  onChange={(e) => setEditLoan({ ...editLoan, employeeId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المبلغ الإجمالي للسلفة ({currencySymbol})</label>
                <input
                  type="number"
                  value={editLoan.totalAmount}
                  onChange={(e) => setEditLoan({ ...editLoan, totalAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المبلغ المسدد حتى الآن ({currencySymbol})</label>
                <input
                  type="number"
                  value={editLoan.paidAmount}
                  onChange={(e) => setEditLoan({ ...editLoan, paidAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">القسط الشهري للخصم التلقائي ({currencySymbol})</label>
                <input
                  type="number"
                  value={editLoan.monthlyInstallment}
                  onChange={(e) => setEditLoan({ ...editLoan, monthlyInstallment: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">سبب السلفة / ملاحظات</label>
                <input
                  type="text"
                  value={editLoan.notes}
                  onChange={(e) => setEditLoan({ ...editLoan, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditLoan(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditAsset}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">تعديل بيانات الأصل / العهدة</h3>
              <button
                type="button"
                onClick={() => setEditAsset(null)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الأصل *</label>
                <input
                  required
                  type="text"
                  value={editAsset.assetName}
                  onChange={(e) => setEditAsset({ ...editAsset, assetName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الفئة</label>
                <input
                  type="text"
                  value={editAsset.category || ''}
                  onChange={(e) => setEditAsset({ ...editAsset, category: e.target.value })}
                  placeholder="مثال: لاب توب، هاتف ذكي، سيارة، إلخ"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الرقم التسلسلي (Serial Number)</label>
                <input
                  type="text"
                  value={editAsset.serialNumber}
                  onChange={(e) => setEditAsset({ ...editAsset, serialNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الحالة</label>
                <select
                  value={editAsset.condition}
                  onChange={(e) => setEditAsset({ ...editAsset, condition: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="جديد">جديد</option>
                  <option value="ممتاز">ممتاز</option>
                  <option value="مستعمل">مستعمل</option>
                  <option value="يحتاج صيانة">يحتاج صيانة</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">القيمة التقديرية ({currencySymbol})</label>
                <input
                  type="number"
                  value={editAsset.value}
                  onChange={(e) => setEditAsset({ ...editAsset, value: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditAsset(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
