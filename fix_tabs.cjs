const fs = require('fs');
let code = fs.readFileSync('src/components/PayrollView.tsx', 'utf8');

const target1 = `      {/* Core Interactive Worksheet Table */}`;
const replace1 = `      {/* Table Toggle Tabs */}
      <div className="flex items-center gap-6 mb-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTableTab('main')}
          className={\`pb-3 px-2 text-sm font-bold border-b-2 transition-colors \${
            activeTableTab === 'main'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }\`}
        >
          جدول المرتبات الأساسي
        </button>
        <button
          onClick={() => setActiveTableTab('overtime')}
          className={\`pb-3 px-2 text-sm font-bold border-b-2 transition-colors \${
            activeTableTab === 'overtime'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }\`}
        >
          سجل تفاصيل الإضافي
        </button>
      </div>

      {activeTableTab === 'main' && (
        <>
      {/* Core Interactive Worksheet Table */}`;

code = code.replace(target1, replace1);

const target2 = `      {/* Overtime Breakdown Table */}
      <div className="mt-8 mb-4 flex items-center justify-between">`;
const replace2 = `      </>
      )}

      {activeTableTab === 'overtime' && (
        <>
      {/* Overtime Breakdown Table */}
      <div className="mt-4 mb-4 flex items-center justify-between">`;

code = code.replace(target2, replace2);

const target3 = `      {/* Detailed Modal for Financial Adjustments */}`;
const replace3 = `      </>
      )}

      {/* Detailed Modal for Financial Adjustments */}`;

code = code.replace(target3, replace3);

fs.writeFileSync('src/components/PayrollView.tsx', code);
