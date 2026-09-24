const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeeEffectsView.tsx', 'utf8');

// 1. Add state for showMissingAttendance Modal
const stateRegex = /const \[editForm, setEditForm\] = useState\(\{[\s\S]*?totalOvertime: 0\n  \}\);\n/;
const newState = `  const [showMissingAttendance, setShowMissingAttendance] = useState(false);
  const [missingMonth, setMissingMonth] = useState(() => {
    const d = new Date();
    return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
  });
`;

content = content.replace(stateRegex, match => match + newState);

// 2. Add calculate missing records and handler
const missingLogic = `
  const missingRecords = useMemo(() => {
    const uniqueDates = Array.from(new Set(attendance.map(a => a.date))).sort().reverse();
    const missing: { id: string, date: string, employee: Employee, existingRecord?: AttendanceRecord }[] = [];
    uniqueDates.forEach(date => {
      if (!date.startsWith(missingMonth)) return;
      
      employees.forEach(emp => {
        const record = attendance.find(a => a.date === date && a.employeeId === emp.id);
        if (!record || record.status === 'absent') {
          missing.push({ id: \`\${date}-\${emp.id}\`, date, employee: emp, existingRecord: record });
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
        id: \`att-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
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
`;

content = content.replace(/(  \/\/ Filter employees)/, missingLogic + '$1');

// 3. Add Button to header
const headerRegex = /<p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">\n            إدارة رصيد الإجازات، الغياب، العارضات، والمستحقات المالية \(الأساسي، الحوافز، الإضافي\)\n          <\/p>\n        <\/div>\n      <\/div>/;

const newHeader = `<p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
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
      </div>`;

content = content.replace(headerRegex, newHeader);

// 4. Add the Modal JSX at the end before final </div>
const modalJsx = `
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
`;

content = content.replace(/    <\/div>\n  \);\n};\n$/, modalJsx + '    </div>\n  );\n};\n');

fs.writeFileSync('src/components/EmployeeEffectsView.tsx', content);
