const fs = require('fs');
const path = require('path');
const outPath = path.join(__dirname, 'src', 'app', '(public)', 'blog', '[slug]', 'page.tsx');
const c = [];
const L = (s) => c.push(s);

