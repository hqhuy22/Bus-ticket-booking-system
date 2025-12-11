/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'public');
const dest = path.join(__dirname, '..', 'dist', 'public');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(src, dest);
console.log('Public assets copied to dist/public');
