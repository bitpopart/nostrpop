import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

// Run one-time data migrations before anything else mounts
import { migrateDesigns } from './lib/clientPortal.ts';
migrateDesigns();

import App from './App.tsx';
import './index.css';

// Import Inter Variable font for modern, clean typography
import '@fontsource-variable/inter';

// Studio fonts
import '@fontsource/bebas-neue';
import '@fontsource-variable/oswald';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/raleway';
import '@fontsource/black-ops-one';
import '@fontsource/righteous';
import '@fontsource/permanent-marker';

createRoot(document.getElementById("root")!).render(<App />);
