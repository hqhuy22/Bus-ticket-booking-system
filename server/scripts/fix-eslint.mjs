#!/usr/bin/env node

/**
 * Script to fix common ESLint issues
 * - Prefix unused variables with underscore
 * - Remove unused imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const fixes = [
  // Remove unused imports
  {
    file: 'controllers/analyticsController.js',
    replacements: [
      { from: "import BusSchedule from '../models/BusSchedule.js';\n", to: '' },
      { from: "import Route from '../models/Route.js';\n", to: '' },
    ],
  },
  {
    file: 'controllers/busBookingController.js',
    replacements: [
      { from: 'const { validateBooking, validatePrice } = validateBookingData;', to: 'const { validateBooking } = validateBookingData;' },
    ],
  },
  {
    file: 'controllers/busController.js',
    replacements: [
      { from: 'const { departureTime, arrivalTime } = req.body;', to: 'const { departureTime } = req.body;' },
    ],
  },
  {
    file: 'controllers/chatbotController.js',
    replacements: [
      { from: 'async function chat(req, res, sessionId, userId) {', to: 'async function chat(req, res, _sessionId, _userId) {' },
      { from: ', sessionId, userId,', to: ', _sessionId, _userId,' },
    ],
  },
  {
    file: 'controllers/paymentController.js',
    replacements: [
      { from: "import Customer from '../models/Customer.js';\n", to: '' },
    ],
  },
  {
    file: 'index.js',
    replacements: [
      { from: 'app.use((err, req, res, next) => {', to: 'app.use((err, req, res, _next) => {' },
    ],
  },
  {
    file: 'utils/ticketGenerator.js',
    replacements: [
      { from: "import fs from 'fs';\n", to: '' },
      { from: 'const __dirname = path.dirname(__filename);', to: '// const __dirname = path.dirname(__filename);' },
      { from: '  const safeText = (text) => {', to: '  // const safeText = (text) => {' },
      { from: "    if (!text) return '';", to: "    // if (!text) return '';" },
      { from: "    return String(text).normalize('NFC');", to: "    // return String(text).normalize('NFC');" },
      { from: '  };', to: '  // };' },
    ],
  },
];

fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(rootDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(from, to);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${file}`);
    }
  } catch (err) {
    console.error(`✗ Error fixing ${file}:`, err.message);
  }
});

console.log('\nDone! Fixed unused variables.');
