const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { colorPngBase64, whitePngBase64 } = data;

        if (colorPngBase64) {
          const colorBuffer = Buffer.from(colorPngBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
          fs.writeFileSync('src/assets/logo/logo-full-color-transparent.png', colorBuffer);
          fs.writeFileSync('public/assets/logo-full-color-transparent.png', colorBuffer);
          fs.writeFileSync('src/assets/logo/logo-full-color.png', colorBuffer);
          fs.writeFileSync('public/assets/logo-full-color.png', colorBuffer);
          console.log('Saved transparent color logo! Bytes:', colorBuffer.length);
        }

        if (whitePngBase64) {
          const whiteBuffer = Buffer.from(whitePngBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
          fs.writeFileSync('src/assets/logo/logo-full-white-transparent.png', whiteBuffer);
          fs.writeFileSync('public/assets/logo-full-white-transparent.png', whiteBuffer);
          console.log('Saved transparent white logo! Bytes:', whiteBuffer.length);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));

        setTimeout(() => process.exit(0), 1000);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
});

server.listen(3333, () => {
  console.log('Logo receiver listening on port 3333');
});
