const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeesView.tsx', 'utf8');

// Table view badge logic replacement
const newTableBadge = `                    <td className="p-3.5">
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                        emp.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        emp.status === 'on_leave' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        emp.status === 'suspended' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }\`}>
                        {emp.status === 'active' ? 'على رأس العمل' :
                         emp.status === 'on_leave' ? 'في إجازة' :
                         emp.status === 'suspended' ? 'موقوف موقتاً' :
                         'ترك العمل'}
                      </span>
                    </td>`;

content = content.replace(/<td className="p-3.5">\s*<span className="px-2 py-0.5 rounded-full text-\[10px\] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">\s*على رأس العمل\s*<\/span>\s*<\/td>/g, newTableBadge);

fs.writeFileSync('src/components/EmployeesView.tsx', content);
