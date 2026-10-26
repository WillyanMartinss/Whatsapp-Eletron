const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const portableDir = path.join(distDir, 'portable');
const portableDir2 = path.join(distDir, 'portable-v2');
const installerDir = path.join(distDir, 'installer');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyArtifact(src, destDir) {
  if (!fs.existsSync(src)) return;
  ensureDir(destDir);
  const fileName = path.basename(src);
  fs.copyFileSync(src, path.join(destDir, fileName));
}

function main() {
  ensureDir(distDir);

  const files = fs.readdirSync(distDir)
    .filter((name) => name.endsWith('.exe'))
    .sort();

  const portable = files.filter((name) => name.includes('portable'));
  const installer = files.filter((name) => name.includes('installer'));

  if (portable.length > 0) {
    copyArtifact(path.join(distDir, portable[0]), portableDir);
    copyArtifact(path.join(distDir, portable[0]), portableDir2);
  }

  if (installer.length > 0) {
    copyArtifact(path.join(distDir, installer[0]), installerDir);
  }

  console.log('Build artifacts organized into dist/portable, dist/portable-v2 and dist/installer.');
}

main();
