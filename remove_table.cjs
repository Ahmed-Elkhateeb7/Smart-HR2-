const fs = require('fs');
let content = fs.readFileSync('src/components/ReportsView.tsx', 'utf8');

const startMarker = `      {/* Department Budget Breakdown Table */}`;
const endMarker = `      {/* Recruitment Platforms Section */}`;

if (content.includes(startMarker) && content.includes(endMarker)) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync('src/components/ReportsView.tsx', content);
  console.log("Table removed successfully.");
} else {
  console.log("Markers not found");
}
