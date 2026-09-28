#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Normalizes path separators to POSIX style (/)
 */
function toPosix(p) {
  return p.split(path.sep).join('/');
}

/**
 * Converts a disk path inside public/ to a public URL path (/assets/...)
 */
function toPublicUrl(diskPath) {
  const rel = toPosix(path.relative(path.join(rootDir, 'public'), diskPath));
  return `/${rel}`;
}

/**
 * Recursively gets all files matching extensions in a directory
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

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage:
  node scripts/move-asset.mjs <source-file-or-glob> <target-folder>

Examples:
  # Move a single image to Big Sur subfolder and update all links:
  npm run move-asset public/assets/trips/2018_Big_Sur_1.jpg "public/assets/trips/Big Sur"

  # Move all Big Sur photos into the subfolder:
  npm run move-asset "public/assets/trips/2018_Big_Sur_*.jpg" "public/assets/trips/Big Sur"

  # Move blog photo into a subfolder:
  npm run move-asset public/assets/blog/moon.jpg "public/assets/blog/astrophotography"
`);
  process.exit(1);
}

const [sourceArg, targetArg] = args;

// Resolve target folder
let targetDir = path.isAbsolute(targetArg)
  ? targetArg
  : path.resolve(rootDir, targetArg);

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`📁 Created directory: ${toPosix(path.relative(rootDir, targetDir))}`);
}

// Find source files
let sourceFiles = [];
if (sourceArg.includes('*')) {
  // Simple glob matching in directory
  const sourcePattern = path.basename(sourceArg);
  const sourceDir = path.dirname(
    path.isAbsolute(sourceArg) ? sourceArg : path.resolve(rootDir, sourceArg)
  );

  const regex = new RegExp(
    '^' + sourcePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$',
    'i'
  );

  if (fs.existsSync(sourceDir)) {
    sourceFiles = fs
      .readdirSync(sourceDir)
      .filter((name) => regex.test(name))
      .map((name) => path.join(sourceDir, name))
      .filter((p) => fs.statSync(p).isFile());
  }
} else {
  const resolved = path.isAbsolute(sourceArg)
    ? sourceArg
    : path.resolve(rootDir, sourceArg);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    sourceFiles = [resolved];
  }
}

if (sourceFiles.length === 0) {
  console.error(`❌ No matching source files found for: ${sourceArg}`);
  process.exit(1);
}

// Scan files in src/ that might reference assets
const contentExtensions = ['.md', '.mdx', '.yaml', '.yml', '.json', '.astro', '.ts', '.js', '.html'];
const searchDirs = [
  path.join(rootDir, 'src'),
  path.join(rootDir, 'public', 'admin'),
];

const contentFiles = searchDirs.flatMap((d) => getFilesRecursively(d, contentExtensions));

console.log(`\n📦 Moving ${sourceFiles.length} file(s) and updating links...\n`);

let totalReplacements = 0;
const modifiedContentFiles = new Set();

for (const srcFile of sourceFiles) {
  const filename = path.basename(srcFile);
  const destFile = path.join(targetDir, filename);

  if (srcFile === destFile) {
    console.log(`⏭️  Skipping ${filename} (already in target destination)`);
    continue;
  }

  const oldPublicUrl = toPublicUrl(srcFile);
  const newPublicUrl = toPublicUrl(destFile);

  // Move the file on disk
  fs.renameSync(srcFile, destFile);
  console.log(`🚚 Moved: ${oldPublicUrl} -> ${newPublicUrl}`);

  // Create search variants (raw and percent-encoded)
  const searchVariants = [
    { from: oldPublicUrl, to: newPublicUrl },
    { from: encodeURI(oldPublicUrl), to: encodeURI(newPublicUrl) },
    // Also support without leading slash if used relatively
    { from: oldPublicUrl.replace(/^\//, ''), to: newPublicUrl.replace(/^\//, '') },
    { from: encodeURI(oldPublicUrl.replace(/^\//, '')), to: encodeURI(newPublicUrl.replace(/^\//, '')) },
  ];

  for (const cFile of contentFiles) {
    if (!fs.existsSync(cFile)) continue;
    let content = fs.readFileSync(cFile, 'utf8');
    let fileChanged = false;

    for (const variant of searchVariants) {
      if (variant.from === variant.to) continue;
      if (content.includes(variant.from)) {
        content = content.replaceAll(variant.from, variant.to);
        fileChanged = true;
        totalReplacements++;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(cFile, content, 'utf8');
      modifiedContentFiles.add(toPosix(path.relative(rootDir, cFile)));
    }
  }
}

console.log(`\n✅ Finished moving files!`);
console.log(`🔗 Updated references in ${modifiedContentFiles.size} content file(s) (${totalReplacements} total links updated):`);
for (const f of modifiedContentFiles) {
  console.log(`   - ${f}`);
}
