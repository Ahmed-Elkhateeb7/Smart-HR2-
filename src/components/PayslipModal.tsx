import React from "react";
import { X, Printer, ShieldCheck, Download, Building2 } from "lucide-react";
import { PayrollRecord } from "../types";

interface PayslipModalProps {
  payrollRecord: PayrollRecord;
  onClose: () => void;
  currencySymbol: string;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  payrollRecord,
  onClose,
  currencySymbol,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const overtimeHoursDay = payrollRecord.overtimeHoursDay || 0;
  const overtimeHoursNight = payrollRecord.overtimeHoursNight || 0;
  const fridayOvertimeHours = payrollRecord.fridayOvertimeHours || 0;
  const bonus = payrollRecord.bonus || 0;

  const totalEarnings =
    payrollRecord.baseSalary +
    payrollRecord.allowances +
    payrollRecord.overtimePay +
    bonus;
  const totalDeductions =
    payrollRecord.deductions +
    payrollRecord.latePenaltyDeduction +
    payrollRecord.loanInstallment +
    payrollRecord.socialInsurance;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-sm relative border border-slate-200">
        {/* Controls - Hidden on Print */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-extrabold text-sm text-slate-800">
              قسيمة المرتب الإلكترونية المعتمدة (Payslip)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Card */}
        <div className="space-y-6 border border-slate-300 p-6 rounded-2xl bg-white/50">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                HR
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  شركة الحلول المتقدمة الذكية (Smart HR)
                </h2>
                <p className="text-[11px] text-slate-500">
                  الرقم الضريبي: 310987654300003 | السجل التجاري: 1010987654
                </p>
                <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                  قسيمة راتب شهر: {payrollRecord.month}
                </p>
              </div>
            </div>

            <div className="text-left text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                {payrollRecord.status === "approved"
                  ? "معتمد رسمياً"
                  : "مسودة قسيمة"}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                رمز القسيمة: {payrollRecord.id}
              </p>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block">
                اسم الموظف:
              </span>
              <span className="font-extrabold text-slate-900">
                {payrollRecord.employeeName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">
                الرقم الوظيفي:
              </span>
              <span className="font-bold text-slate-800">
                {payrollRecord.employeeCode}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">
                المسمى الوظيفي:
              </span>
              <span className="font-bold text-slate-800">
                {payrollRecord.position}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">القسم:</span>
              <span className="font-bold text-slate-800">
                {payrollRecord.department}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">
                تاريخ الإصدار:
              </span>
              <span className="font-bold text-slate-800">
                {payrollRecord.approvalDate || new Date().toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Earnings Column */}
            <div className="border border-emerald-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-emerald-600 text-white font-bold p-2 text-center text-xs">
                المستحقات والإضافات (+)
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">الراتب الأساسي:</span>
                  <span className="font-extrabold">
                    {payrollRecord.baseSalary.toLocaleString()} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">الحوافز والبدلات:</span>
                  <span className="font-bold text-emerald-600">
                    +{payrollRecord.allowances.toLocaleString()}{" "}
                    {currencySymbol}
                  </span>
                </div>
                {overtimeHoursDay > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      إضافي نهاري ({overtimeHoursDay} س ×{" "}
                      {payrollRecord.overtimeRateDay || 1.5}):
                    </span>
                    <span className="font-bold text-emerald-600">
                      +
                      {Math.round(
                        overtimeHoursDay *
                          (payrollRecord.baseSalary / 240) *
                          (payrollRecord.overtimeRateDay || 1.5),
                      ).toLocaleString()}{" "}
                      {currencySymbol}
                    </span>
                  </div>
                )}
                {overtimeHoursNight > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      إضافي ليلي ({overtimeHoursNight} س ×{" "}
                      {payrollRecord.overtimeRateNight || 2.0}):
                    </span>
                    <span className="font-bold text-emerald-600">
                      +
                      {Math.round(
                        overtimeHoursNight *
                          (payrollRecord.baseSalary / 240) *
                          (payrollRecord.overtimeRateNight || 2.0),
                      ).toLocaleString()}{" "}
                      {currencySymbol}
                    </span>
                  </div>
                )}
                {fridayOvertimeHours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      إضافي يوم الجمعة ({fridayOvertimeHours} س ×{" "}
                      {payrollRecord.fridayOvertimeRate || 2.0}):
                    </span>
                    <span className="font-bold text-emerald-600">
                      +
                      {Math.round(
                        fridayOvertimeHours *
                          (payrollRecord.baseSalary / 240) *
                          (payrollRecord.fridayOvertimeRate || 2.0),
                      ).toLocaleString()}{" "}
                      {currencySymbol}
                    </span>
                  </div>
                )}
                {overtimeHoursDay === 0 &&
                  overtimeHoursNight === 0 &&
                  fridayOvertimeHours === 0 &&
                  payrollRecord.overtimePay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        ساعات إضافية عامة ({payrollRecord.overtimeHours} س):
                      </span>
                      <span className="font-bold text-emerald-600">
                        +{payrollRecord.overtimePay.toLocaleString()}{" "}
                        {currencySymbol}
                      </span>
                    </div>
                  )}
                {bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">الحوافز والمكافآت:</span>
                    <span className="font-bold text-emerald-600">
                      +{bonus.toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900">
                  <span>إجمالي الاستحقاق:</span>
                  <span className="text-emerald-600">
                    {totalEarnings.toLocaleString()} {currencySymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-red-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-red-600 text-white font-bold p-2 text-center text-xs">
                الخصومات والاستقطاعات (-)
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    خصم التأمينات الاجتماعية:
                  </span>
                  <span className="font-bold text-red-600">
                    -{payrollRecord.socialInsurance.toLocaleString()}{" "}
                    {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">قسط السلفة التلقائي:</span>
                  <span className="font-bold text-red-600">
                    -{payrollRecord.loanInstallment.toLocaleString()}{" "}
                    {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">خصم التأخير والجزاءات:</span>
                  <span className="font-bold text-red-600">
                    -{payrollRecord.latePenaltyDeduction.toLocaleString()}{" "}
                    {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900">
                  <span>إجمالي الخصومات:</span>
                  <span className="text-red-600">
                    -{totalDeductions.toLocaleString()} {currencySymbol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Amount Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-gradient-to-r dark:from-slate-900 dark:to-blue-950 text-slate-900 dark:text-white flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs text-blue-300 font-bold block">
                الصافي المستحق للتحويل للبنك
              </span>
              <span className="text-2xl font-black">
                {payrollRecord.netSalary.toLocaleString()} {currencySymbol}
              </span>
            </div>
            <div className="text-left text-[10px] text-slate-300">
              <p>تم الحساب وفق سياسات الموارد البشرية</p>
              <p className="text-emerald-400 font-bold mt-0.5">
                توقيع رقمي موثق ✓
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
