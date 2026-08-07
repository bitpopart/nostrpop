import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';
const indexPath = join(distDir, 'index.html');
const manifestPath = join(distDir, 'manifest.webmanifest');

// Check if dist directory exists
if (!existsSync(distDir)) {
  console.error('❌ dist directory does not exist');
  process.exit(1);
}

// Fix index.html
try {
  if (!existsSync(indexPath)) {
    console.error('❌ index.html does not exist in dist directory');
    process.exit(1);
  }

  let indexHtml = readFileSync(indexPath, 'utf-8');

  // Fix base paths
  indexHtml = indexHtml.replace(/%VITE_BASE%/g, '/');

  // Remove Shakespeare dev-environment Tailwind config script injection.
  // The script tag can appear in various forms depending on how it was injected
  // (e.g. directly after a </style>, on its own line, with or without spaces).
  // Use a broad pattern that catches all variants.
  indexHtml = indexHtml.replace(/<script\s[^>]*src="[^"]*shakespeare_tailwind[^"]*"[^>]*><\/script>/gi, '');

  writeFileSync(indexPath, indexHtml);
  console.log('✅ Fixed base paths in index.html');
  console.log('✅ Removed Shakespeare dev-environment script tags from index.html');
} catch (e) {
  console.error('❌ Error fixing index.html:', e.message);
  process.exit(1);
}

// Delete shakespeare_tailwind config JS/map files from dist (wrong MIME type on GitHub Pages)
try {
  const distFiles = readdirSync(distDir);
  for (const f of distFiles) {
    if (/shakespeare_tailwind/i.test(f)) {
      unlinkSync(join(distDir, f));
      console.log(`✅ Deleted ${f} from dist (dev-only file)`);
    }
  }
} catch (e) {
  console.warn('⚠️  Warning: Could not delete shakespeare_tailwind files:', e.message);
}

// Fix manifest if it exists
try {
  if (existsSync(manifestPath)) {
    let manifest = readFileSync(manifestPath, 'utf-8');
    manifest = manifest.replace(/%VITE_BASE%/g, '/');
    writeFileSync(manifestPath, manifest);
    console.log('✅ Fixed base paths in manifest.webmanifest');
  } else {
    console.log('ℹ️  manifest.webmanifest not found, skipping');
  }
} catch (e) {
  console.warn('⚠️  Warning: Could not fix manifest.webmanifest:', e.message);
}

console.log('✅ Base path fixing complete');
