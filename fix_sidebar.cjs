const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

content = content.replace(
  /className=\{`flex items-center justify-between h-20 px-4 border-b \$\{\s*currentDarkMode \? 'border-slate-800' : 'border-slate-100'\s*\}\`\}/g,
  'className="flex items-center justify-between h-20 px-4 border-b border-slate-100 dark:border-slate-800"'
);

content = content.replace(
  /className=\{`font-extrabold text-xl tracking-tight \$\{\s*currentDarkMode \? 'text-white' : 'text-slate-900'\s*\}\`\}/g,
  'className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white"'
);

content = content.replace(
  /className=\{`p-1\.5 rounded-lg transition-colors \$\{\s*currentDarkMode\s*\?\s*'text-slate-400 hover:text-white hover:bg-slate-800'\s*:\s*'text-slate-400 hover:text-slate-700 hover:bg-slate-100'\s*\}\`\}/g,
  'className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"'
);

content = content.replace(
  /className=\{`w-full flex items-center gap-3 px-3\.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative \$\{\s*isActive\s*\?\s*'bg-blue-600 text-white shadow-sm shadow-blue-600\/20'\s*:\s*currentDarkMode\s*\?\s*'text-slate-300 hover:bg-slate-800\/70 hover:text-white'\s*:\s*'text-slate-600 hover:bg-slate-100\/80 hover:text-slate-900'\s*\}\`\}/g,
  'className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"}`}'
);

content = content.replace(
  /\$\{\s*item\.highlight && !isActive\s*\?\s*currentDarkMode\s*\?\s*'text-blue-400'\s*:\s*'text-blue-600'\s*:\s*''\s*\}/g,
  '${item.highlight && !isActive ? "text-blue-600 dark:text-blue-400" : ""}'
);

content = content.replace(
  /className=\{`p-3 border-t space-y-3 \$\{\s*currentDarkMode \? 'border-slate-800' : 'border-slate-100'\s*\}\`\}/g,
  'className="p-3 border-t space-y-3 border-slate-100 dark:border-slate-800"'
);

content = content.replace(
  /className=\{`w-full flex items-center justify-between px-3\.5 py-2\.5 rounded-xl text-xs font-semibold transition-colors \$\{\s*currentDarkMode\s*\?\s*'bg-slate-800\/60 hover:bg-slate-800 text-slate-300 hover:text-white'\s*:\s*'bg-slate-100 hover:bg-slate-200\/80 text-slate-700'\s*\}\`\}/g,
  'className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"'
);

content = content.replace(
  /className=\{`text-\[10px\] px-2 py-0\.5 rounded-md \$\{\s*currentDarkMode\s*\?\s*'bg-slate-700\/80 text-slate-300'\s*:\s*'bg-white text-slate-700 border border-slate-200'\s*\}\`\}/g,
  'className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"'
);

content = content.replace(
  /className=\{`text-xs font-bold truncate \$\{\s*currentDarkMode \? 'text-slate-200' : 'text-slate-800'\s*\}\`\}/g,
  'className="text-xs font-bold truncate text-slate-800 dark:text-slate-200"'
);

content = content.replace(
  /className=\{`text-\[10px\] truncate \$\{\s*currentDarkMode \? 'text-slate-400' : 'text-slate-500'\s*\}\`\}/g,
  'className="text-[10px] truncate text-slate-500 dark:text-slate-400"'
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
