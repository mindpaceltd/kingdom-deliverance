const fs = require('fs');
const path = require('path');
const outPath = path.join(__dirname, 'src', 'app', '(public)', 'blog', '[slug]', 'page.tsx');
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  fs.writeFileSync(outPath, data, 'utf8');
  console.log('Written', data.length, 'chars');
});
