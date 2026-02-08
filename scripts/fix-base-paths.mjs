import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';
const indexPath = join(distDir, 'index.html');
const manifestPath = join(distDir, 'manifest.webmanifest');

// Read the index.html
let indexHtml = readFileSync(indexPath, 'utf-8');

// Replace %VITE_BASE% with /nostrpop/
indexHtml = indexHtml.replace(/%VITE_BASE%/g, '/nostrpop/');

// Write back
writeFileSync(indexPath, indexHtml);

console.log('✅ Fixed base paths in index.html');

// Also fix manifest if it exists and has the same placeholder
try {
  let manifest = readFileSync(manifestPath, 'utf-8');
  manifest = manifest.replace(/%VITE_BASE%/g, '/nostrpop/');
  writeFileSync(manifestPath, manifest);
  console.log('✅ Fixed base paths in manifest.webmanifest');
} catch (e) {
  // Manifest might not need fixing
}
