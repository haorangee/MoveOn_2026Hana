const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing web export file: ${indexPath}`);
}

let html = fs.readFileSync(indexPath, 'utf8');

const metadata = [
  '<meta name="application-name" content="MoveOn">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="MoveOn">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<link rel="manifest" href="/manifest.json">',
].filter((tag) => !html.includes(tag));

if (metadata.length > 0) {
  html = html.replace('</head>', `  ${metadata.join('\n  ')}\n</head>`);
  fs.writeFileSync(indexPath, html);
}
