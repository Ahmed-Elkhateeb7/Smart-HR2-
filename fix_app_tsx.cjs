const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                  checkIn: \`\${now.getHours()}:\${now.getMinutes()}\`,
                  status: 'present',
                  delayMinutes: 0,
                  earlyLeaveMinutes: 0,
                  shiftName: 'صباحي'
                };`,
  `                  checkIn: \`\${now.getHours()}:\${now.getMinutes()}\`,
                  checkOut: '',
                  status: 'present',
                  delayMinutes: 0,
                  earlyLeaveMinutes: 0,
                  shiftName: 'صباحي'
                };`
);

fs.writeFileSync('src/App.tsx', content);
