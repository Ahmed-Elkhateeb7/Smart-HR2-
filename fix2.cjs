const fs = require('fs');
let code = fs.readFileSync('src/components/PayrollView.tsx', 'utf8');

// Use regex to remove everything from `                    </td>>` up to the end of Friday Overtime Hours </td>

code = code.replace(/                    <\/td>>\s*\)\s*:\s*\(\s*<span[\s\S]*?{nightHours}[\s\S]*?<\/td>\s*{\/\* Friday Overtime Hours \*\/}\s*<td[\s\S]*?value={fridayHours}[\s\S]*?<\/td>/, '                    </td>');

fs.writeFileSync('src/components/PayrollView.tsx', code);
