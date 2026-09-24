const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeeEffectsView.tsx', 'utf8');

// 1. Remove unnecessary imports
content = content.replace(/import \{ jsPDF \} from "jspdf";\n/, '');
content = content.replace(/import html2canvas from "html2canvas";\n/, '');
content = content.replace(/import \* as XLSX from 'xlsx';\n/, '');
content = content.replace(/  Printer,\n/g, '');
content = content.replace(/  Loader2,\n/g, '');

content = content.replace(/const \[printModalData, setPrintModalData\] = useState<Employee \| null>\(null\);\n  const \[isGeneratingPdf, setIsGeneratingPdf\] = useState<string \| null>\(null\);\n/, '');

// 2. Replace handlePrint and handleExportExcel with handleExportCSV
const methodsRegex = /const handlePrint = \(employee: Employee\) => \{[\s\S]*?XLSX\.writeFile\(wb, `مؤثرات_\$\{employee.name.replace\(\/\\s\+\/g, '_'\)\}\.xlsx`\);\n  \};\n/g;

const newMethods = `const handleExportCSV = (employee: Employee) => {
    const eff = calculateEmployeeEffects(employee);
    
    const csvContent = [
      ['اسم الموظف', employee.name],
      ['الكود الوظيفي', employee.employeeCode],
      ['القسم', employee.department],
      ['المسمى الوظيفي', employee.position],
      [],
      ['البيان', 'الرصيد الكلي', 'المستهلك', 'المتبقي'],
      ['إجازة اعتيادية (سنوية)', eff.annualLeaveTotal, eff.consumedAnnual, eff.remainingAnnual],
      ['إجازة عارضة', eff.casualLeaveTotal, eff.consumedCasual, eff.remainingCasual],
      ['أيام الغياب', '-', eff.absences, '-'],
      [],
      ['البيانات المالية والمستحقات', 'الرقم'],
      ['الراتب الأساسي', employee.baseSalary],
      ['إجمالي البدلات', eff.totalAllowances],
      ['حوافز ومكافآت (حتى تاريخه)', eff.totalIncentives],
      ['أجر عمل إضافي (حتى تاريخه)', eff.totalOvertime]
    ].map(row => row.join(',')).join('\\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`مؤثرات_\${employee.name.replace(/\\s+/g, '_')}.csv\`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
`;

content = content.replace(methodsRegex, newMethods);

// 3. Replace buttons in JSX
const buttonsRegex = /<button \n                    onClick=\{\(\) => handleExportExcel\(employee\)\}[\s\S]*?<\/button>\n                  <button \n                    onClick=\{\(\) => handlePrint\(employee\)\}[\s\S]*?<\/button>\n/g;

const newButtons = `<button 
                    onClick={() => handleExportCSV(employee)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                    title="تحميل بصيغة CSV"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
`;

content = content.replace(buttonsRegex, newButtons);

// 4. Remove print view styling and JSX
const printViewRegex = /\{\/\* Print View \(Hidden visually, used for printing\) \*\/\}\n      <style>\{`[\s\S]*?<\/style>\n      \n      \{printModalData && \([\s\S]*?\}\n                  <\/div>\n               <\/div>\n             \);\n          \}\)\(\)\}\n          <\/div>\n        <\/div>\n      \)\}\n/g;

content = content.replace(printViewRegex, '');

fs.writeFileSync('src/components/EmployeeEffectsView.tsx', content);
console.log('Update complete');
