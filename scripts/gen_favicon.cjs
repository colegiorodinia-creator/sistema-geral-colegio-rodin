const fs = require('fs');

const svg = fs.readFileSync('public/favicon.svg', 'utf8');
const match = svg.match(/base64,([^"']+)/);
if (match) {
  const buf = Buffer.from(match[1], 'base64');
  fs.writeFileSync('public/favicon.png', buf);
  fs.writeFileSync('public/favicon.ico', buf);
  fs.writeFileSync('public/assets/thinker-mark-orange.png', buf);
  fs.writeFileSync('src/assets/logo/thinker-mark-orange.png', buf);
  console.log('Saved favicon.png, favicon.ico and thinker-mark-orange.png successfully!');
}
