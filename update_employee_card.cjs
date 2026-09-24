const fs = require('fs');

let content = fs.readFileSync('src/components/EmployeesView.tsx', 'utf8');

const targetStr = `                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {emp.employeeCode}
                  </span>
                </div>`;

const newStr = `                  <div className="flex flex-col gap-1 items-end">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {emp.employeeCode}
                    </span>
                    <span className={\`px-2 py-0.5 rounded-full text-[9px] font-bold \${
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
                  </div>
                </div>`;

content = content.replace(targetStr, newStr);

fs.writeFileSync('src/components/EmployeesView.tsx', content);
