const fs = require('fs');
let code = fs.readFileSync('src/components/PayrollView.tsx', 'utf8');

const brokenStr = `              <th className="p-3.5 text-center font-black text                          <Plus className="w-4 h-4" />`;
const fixedStr = `              <th className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 min-w-[110px]">
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
                        ? \`لا توجد بيانات مسير رواتب منشأة لشهر \${selectedMonth} حتى الآن.\`
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
                              \`تم توليد مسير رواتب شهر \${selectedMonth} لعدد \${employees.length} موظف بنجاح.\`,
                            );
                          }}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 mt-2 mx-auto"
                        >
                          <Plus className="w-4 h-4" />`;

code = code.replace(brokenStr, fixedStr);

const brokenStr2 = `                    </td>>
                      ) : (
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {nightHours}س{" "}
                          <span className="text-[9px] text-slate-400 font-normal">
                            (×2.0)
                          </span>
                        </span>
                      )}
                    </td>
                    {/* Friday Overtime Hours */}
                    <td className="p-2 text-center">
                      {isSpreadsheetMode && !isApproved ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={fridayHours}
                            onChange={(e) =>
                              handleFieldChange(
                                rec,
                                "fridayOvertimeHours",
                                e.target.value,
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-14 p-1.5 text-center rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-emerald-600 dark:text-emerald-300"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {fridayHours}س{" "}
                          <span className="text-[9px] text-slate-400 font-normal">
                            (×2.0)
                          </span>
                        </span>
                      )}
                    </td>`;

code = code.replace(brokenStr2, "                    </td>");

fs.writeFileSync('src/components/PayrollView.tsx', code);
