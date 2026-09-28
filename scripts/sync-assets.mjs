#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

/**
 * Normalizes path separators to POSIX style (/)
 */
function toPosix(p) {
  return p.split(path.sep).join('/');
}

/**
 * Recursively gets all files in a directory
 */
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

// 1. Build an index of all existing assets in public/
const publicFiles = getFilesRecursively(publicDir).filter(
  (f) => !path.basename(f).startsWith('.gitkeep')
);

// Map of filename -> array of public URL paths
const assetIndex = new Map();

for (const diskPath of publicFiles) {
  const filename = path.basename(diskPath);
  const relPath = toPosix(path.relative(publicDir, diskPath));
  const publicUrl = `/${relPath}`;

  if (!assetIndex.has(filename)) {
    assetIndex.set(filename, []);
  }
  assetIndex.get(filename).push(publicUrl);
}

// 2. Scan content files
const contentExtensions = ['.md', '.mdx', '.yaml', '.yml', '.json', '.astro'];
const searchDirs = [path.join(rootDir, 'src', 'content'), path.join(rootDir, 'src', 'pages')];
const contentFiles = searchDirs.flatMap((d) => getFilesRecursively(d, contentExtensions));

let totalFixed = 0;
const modifiedFiles = new Set();

// Regex to detect asset paths like /assets/... or /img/...
const assetRegex = /(["']|\(|^|\s)(\/(?:assets|img)\/[^"'\s\)]+)/g;

for (const cFile of contentFiles) {
  if (!fs.existsSync(cFile)) continue;
  let content = fs.readFileSync(cFile, 'utf8');
  let fileChanged = false;

  // Find all matches
  const matches = [...content.matchAll(assetRegex)];

  for (const match of matches) {
    const rawUrl = match[2];
    const decodedUrl = decodeURI(rawUrl);

    // Check if the file exists on disk
    const diskPathDecoded = path.join(publicDir, decodedUrl.replace(/^\//, ''));
    if (fs.existsSync(diskPathDecoded)) {
      continue; // Exists, valid path
    }

    // Missing! Try to find by filename
    const filename = path.basename(decodedUrl);
    const candidates = assetIndex.get(filename) || [];

    if (candidates.length === 1) {
      const newUrl = candidates[0];
      console.log(
        `🔄 Auto-fixing moved asset in ${toPosix(path.relative(rootDir, cFile))}:`
      );
      console.log(`   ${rawUrl} -> ${newUrl}`);

      content = content.replaceAll(rawUrl, newUrl);
      if (rawUrl !== encodeURI(rawUrl)) {
        content = content.replaceAll(encodeURI(rawUrl), encodeURI(newUrl));
      }
      fileChanged = true;
      totalFixed++;
    } else if (candidates.length > 1) {
      console.warn(
        `⚠️  Multiple locations found for ${filename} referenced in ${toPosix(
          path.relative(rootDir, cFile)
        )}:`,
        candidates
      );
    }
  }

  if (fileChanged) {
    fs.writeFileSync(cFile, content, 'utf8');
    modifiedFiles.add(toPosix(path.relative(rootDir, cFile)));
  }
}

if (totalFixed > 0) {
  console.log(`\n✨ Successfully synced and fixed ${totalFixed} link(s) across ${modifiedFiles.size} file(s)!`);
} else {
  console.log(`✅ All asset links are up to date!`);
}
