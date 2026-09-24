const fs = require('fs');
let content = fs.readFileSync('src/components/AttendanceView.tsx', 'utf8');

const buttonsHtml = `
          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
            <button className="px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 transition-colors flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              كل السجلات
            </button>
            <button className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20">
              <CheckCircle2 className="w-4 h-4" />
              بصمات اليوم
            </button>
            <button className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-teal-500 hover:bg-teal-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-teal-500/20">
              <Users className="w-4 h-4" />
              حضور جماعي
            </button>
            <button className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-orange-500/20">
              <Sparkles className="w-4 h-4" />
              ذكاء الحضور
            </button>
            <button className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-amber-500 hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-500/20">
              <Download className="w-4 h-4" />
              استيراد من ZKTeco / Excel
            </button>
            <button className="px-3 py-1.5 rounded-full border border-transparent text-white text-xs font-bold bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
              <Smartphone className="w-4 h-4" />
              لينكات بصمة الموبايل
            </button>
          </div>
`;

content = content.replace('{activeSubTab === \'daily\' ? (\n        <div className="space-y-4">', '{activeSubTab === \'daily\' ? (\n        <div className="space-y-4">\n' + buttonsHtml);

fs.writeFileSync('src/components/AttendanceView.tsx', content);
