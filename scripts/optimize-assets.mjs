#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function toPublicUrl(diskPath) {
  const rel = toPosix(path.relative(publicDir, diskPath));
  return `/${rel}`;
}

function getFilesRecursively(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions || extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

const args = process.argv.slice(2);
const scope = (args[0] || 'blog').toLowerCase(); // 'blog', 'trips', 'all', or a specific path

let targetDir;
if (scope === 'blog') {
  targetDir = path.join(publicDir, 'assets', 'blog');
} else if (scope === 'trips') {
  targetDir = path.join(publicDir, 'assets', 'trips');
} else if (scope === 'all') {
  targetDir = path.join(publicDir, 'assets');
} else {
  targetDir = path.isAbsolute(scope) ? scope : path.resolve(rootDir, scope);
}

if (!fs.existsSync(targetDir)) {
  console.error(`Target directory not found: ${targetDir}`);
  process.exit(1);
}

// Find all raster images (jpeg, jpg, png) that aren't already webp
const imageFiles = getFilesRecursively(targetDir, ['.jpg', '.jpeg', '.png']);

if (imageFiles.length === 0) {
  console.log(`No unoptimized images found in ${toPosix(path.relative(rootDir, targetDir))}`);
  process.exit(0);
}

// Collect all content files for link updates
const contentExtensions = ['.md', '.mdx', '.yaml', '.yml', '.json', '.astro', '.html'];
const searchDirs = [
  path.join(rootDir, 'src'),
  path.join(rootDir, 'public', 'admin')
];
const contentFiles = searchDirs.flatMap(d => getFilesRecursively(d, contentExtensions));

console.log(`\n🚀 Optimizing ${imageFiles.length} image(s) to WebP (max 2400x2400, quality 85)...\n`);

const results = [];
let totalOriginalSize = 0;
let totalNewSize = 0;
let totalLinksUpdated = 0;

for (const imgPath of imageFiles) {
  const originalStat = fs.statSync(imgPath);
  const oldPublicUrl = toPublicUrl(imgPath);
  const dir = path.dirname(imgPath);
  const ext = path.extname(imgPath);
  const baseName = path.basename(imgPath, ext);
  const newPath = path.join(dir, `${baseName}.webp`);
  const newPublicUrl = toPublicUrl(newPath);

  // Resize and convert to WebP
  await sharp(imgPath)
    .resize({
      width: 2400,
      height: 2400,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 85 })
    .toFile(newPath);

  const newStat = fs.statSync(newPath);
  totalOriginalSize += originalStat.size;
  totalNewSize += newStat.size;

  // Remove the old unoptimized file
  fs.unlinkSync(imgPath);

  // Update links across all content files
  const urlWithoutExt = oldPublicUrl.slice(0, -ext.length);
  const extsToMatch = new Set([
    ext,
    ext.toLowerCase(),
    ext.toUpperCase(),
    ...(ext.toLowerCase() === '.jpeg' ? ['.jpg', '.JPG'] : []),
    ...(ext.toLowerCase() === '.jpg' ? ['.jpeg', '.JPEG'] : [])
  ]);

  const searchVariants = [];
  for (const e of extsToMatch) {
    const candidate = `${urlWithoutExt}${e}`;
    searchVariants.push(
      { from: candidate, to: newPublicUrl },
      { from: encodeURI(candidate), to: encodeURI(newPublicUrl) },
      { from: candidate.replace(/^\//, ''), to: newPublicUrl.replace(/^\//, '') },
      { from: encodeURI(candidate.replace(/^\//, '')), to: encodeURI(newPublicUrl.replace(/^\//, '')) }
    );
  }

  let fileLinksUpdated = 0;
  for (const cFile of contentFiles) {
    if (!fs.existsSync(cFile)) continue;
    let content = fs.readFileSync(cFile, 'utf8');
    let changed = false;

    for (const v of searchVariants) {
      if (v.from !== v.to && content.includes(v.from)) {
        content = content.replaceAll(v.from, v.to);
        changed = true;
        fileLinksUpdated++;
        totalLinksUpdated++;
      }
    }

    if (changed) {
      fs.writeFileSync(cFile, content, 'utf8');
    }
  }

  const savingsPct = (((originalStat.size - newStat.size) / originalStat.size) * 100).toFixed(1);
  results.push({
    file: path.basename(imgPath),
    oldSize: (originalStat.size / 1024).toFixed(1) + ' KB',
    newFile: `${baseName}.webp`,
    newSize: (newStat.size / 1024).toFixed(1) + ' KB',
    savings: `-${savingsPct}%`,
    links: fileLinksUpdated
  });
}

console.table(results);

const totalSavingsMb = ((totalOriginalSize - totalNewSize) / (1024 * 1024)).toFixed(2);
const totalSavingsPct = (((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100).toFixed(1);

console.log(`\n✨ Done! Saved ${totalSavingsMb} MB (${totalSavingsPct}% reduction)!`);
console.log(`🔗 Updated ${totalLinksUpdated} link(s) across site content.\n`);
