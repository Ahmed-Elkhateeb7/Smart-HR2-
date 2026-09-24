const fs = require('fs');
let code = fs.readFileSync('src/components/PayrollView.tsx', 'utf8');

const target1 = `              <th className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10">
                إجمالي قيمة الإضافي
              </th>
            </tr>
          </thead>`;
const replace1 = `              <th className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10">
                إجمالي قيمة الإضافي
              </th>
              <th className="p-3.5 text-center min-w-[140px]">
                التحكم
              </th>
            </tr>
          </thead>`;

code = code.replace(target1, replace1);

const target2 = `                      +{rec.overtimePay.toLocaleString()} {currencySymbol}
                    </td>
                  </tr>`;
const replace2 = `                      +{rec.overtimePay.toLocaleString()} {currencySymbol}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        disabled={isApproved}
                        onClick={() => setEditingRecord(rec)}
                        className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 mx-auto \${
                          isApproved
                            ? "bg-slate-100 text-slate-400 dark:bg-slate-900 cursor-not-allowed"
                            : "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        }\`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    </td>
                  </tr>`;

code = code.replace(target2, replace2);

// Fix colSpan
const target3 = `                <td colSpan={6} className="p-10 text-center text-slate-500 font-bold">
                  لا توجد سجلات.`;
const replace3 = `                <td colSpan={7} className="p-10 text-center text-slate-500 font-bold">
                  لا توجد سجلات.`;

code = code.replace(target3, replace3);

fs.writeFileSync('src/components/PayrollView.tsx', code);
